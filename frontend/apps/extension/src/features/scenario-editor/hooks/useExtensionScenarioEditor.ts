import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createAdminApiClient,
  type AdminApiClient,
} from '@interactive-onboarding/api-client'
import type { ElementDescriptor } from '@interactive-onboarding/element-selector'
import { createLocalScenarioDraft } from '../../../entities/draft/model/createLocalDraft'
import type { StepDraft } from '../../../entities/draft/model/types'
import type { ExtensionSettings } from '../../../entities/settings/model/types'
import {
  getApiBaseUrl,
  normalizeSettings,
  requestPlatformPermission,
} from '../../../shared/chrome/platformPermission'
import {
  getActiveTabContext,
  sendMessageToTab,
} from '../../../shared/messages/runtime'
import type {
  ExtensionMessage,
  TabContext,
} from '../../../shared/messages/types'
import { createExtensionStorage } from '../../../shared/storage/extensionStorage'
import { createExtensionScenarioRepository } from '../api/createExtensionScenarioRepository'
import type { ExtensionScenarioRepository } from '../api/createExtensionScenarioRepository'
import {
  addDraftStep,
  deleteDraftStep,
  moveDraftStep,
  updateDraftStep,
} from '../model/draftMutations'
import type {
  ReadyWorkspace,
  TabWorkspaceSnapshot,
  WorkspaceState,
} from '../model/types'

type UseExtensionScenarioEditorOptions = {
  createApiClient?: (apiBaseUrl: string) => AdminApiClient
}

const defaultCreateApiClient = (apiBaseUrl: string) =>
  createAdminApiClient({ apiBaseUrl })

export function useExtensionScenarioEditor({
  createApiClient = defaultCreateApiClient,
}: UseExtensionScenarioEditorOptions = {}) {
  const storage = useMemo(() => createExtensionStorage(), [])
  const [state, setState] = useState<WorkspaceState>({ status: 'booting' })
  const stateRef = useRef(state)
  const repositoryRef = useRef<ExtensionScenarioRepository | undefined>(
    undefined,
  )

  useEffect(() => {
    stateRef.current = state

    if (state.status !== 'ready') {
      return
    }

    const interaction =
      state.interaction.status === 'previewing'
        ? ({ status: 'idle' } as const)
        : state.interaction
    const snapshot: TabWorkspaceSnapshot = {
      settings: state.settings,
      draft: state.draft,
      selectedStepId: state.selectedStepId,
      interaction,
      save:
        state.save.status === 'saving'
          ? { status: 'dirty' }
          : state.save,
      hasPublishedScenario: state.hasPublishedScenario,
    }

    void storage.setTabSnapshot(state.context.tabId, snapshot)
  }, [state, storage])

  const createRepository = useCallback(
    (settings: ExtensionSettings) => {
      const repository = createExtensionScenarioRepository(
        createApiClient(getApiBaseUrl(settings.platformUrl)),
        settings.projectKey,
      )
      repositoryRef.current = repository
      return repository
    },
    [createApiClient],
  )

  const loadPage = useCallback(
    async (
      settings: ExtensionSettings,
      context: TabContext,
      options: { createWhenEmpty?: boolean } = {},
    ) => {
      setState({ status: 'loading', settings, context })

      try {
        const repository =
          repositoryRef.current ?? createRepository(settings)
        const result = await repository.findPageDraft(context.pathname)

        if (result.draft) {
          setState({
            status: 'ready',
            settings,
            context,
            draft: result.draft,
            selectedStepId: result.draft.steps[0]?.id,
            hasPublishedScenario: result.hasPublishedScenario,
            save: { status: 'clean' },
            interaction: { status: 'idle' },
          })
          return
        }

        if (options.createWhenEmpty) {
          setState({
            status: 'ready',
            settings,
            context,
            draft: createLocalScenarioDraft(
              result.projectId,
              context.pathname,
              context.title,
            ),
            hasPublishedScenario: result.hasPublishedScenario,
            save: { status: 'dirty' },
            interaction: { status: 'idle' },
          })
          return
        }

        setState({
          status: 'empty',
          settings,
          context,
          projectId: result.projectId,
          hasPublishedScenario: result.hasPublishedScenario,
        })
      } catch (error) {
        setState({
          status: 'error',
          settings,
          context,
          message: getErrorMessage(error),
        })
      }
    },
    [createRepository],
  )

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const [settings, tabResponse] = await Promise.all([
        storage.getSettings(),
        getActiveTabContext(),
      ])

      if (cancelled) {
        return
      }

      if (tabResponse.status === 'unsupported') {
        setState({ status: 'unsupported', message: tabResponse.message })
        return
      }

      const { context } = tabResponse

      if (!settings) {
        setState({
          status: 'setup',
          context,
          form: { platformUrl: '', projectKey: '' },
        })
        return
      }

      createRepository(settings)
      const snapshot = await storage.getTabSnapshot<TabWorkspaceSnapshot>(
        context.tabId,
      )

      if (
        snapshot &&
        snapshot.settings.platformUrl === settings.platformUrl &&
        snapshot.settings.projectKey === settings.projectKey &&
        snapshot.draft.url === context.pathname
      ) {
        setState({
          status: 'ready',
          settings,
          context,
          draft: snapshot.draft,
          selectedStepId: snapshot.selectedStepId,
          hasPublishedScenario: snapshot.hasPublishedScenario,
          save: snapshot.save,
          interaction: snapshot.interaction,
        })

        if (snapshot.interaction.status === 'picking') {
          void sendMessageToTab(context.tabId, { type: 'PICKER_START' })
        }
        return
      }

      await loadPage(settings, context)
    }

    void bootstrap().catch((error: unknown) => {
      if (!cancelled) {
        setState({ status: 'error', message: getErrorMessage(error) })
      }
    })

    return () => {
      cancelled = true
    }
  }, [createRepository, loadPage, storage])

  const updateReady = useCallback(
    (transform: (current: ReadyWorkspace) => ReadyWorkspace) => {
      setState((current) =>
        current.status === 'ready' ? transform(current) : current,
      )
    },
    [],
  )

  const applySelectedElement = useCallback(
    (descriptor: ElementDescriptor) => {
      updateReady((current) => {
        if (current.interaction.status !== 'picking') {
          return current
        }

        if (
          current.interaction.mode === 'retarget' &&
          current.interaction.stepId
        ) {
          return {
            ...current,
            draft: updateDraftStep(
              current.draft,
              current.interaction.stepId,
              {
                selector: descriptor.selector,
                target: descriptor,
              },
            ),
            save: { status: 'dirty' },
            interaction: { status: 'idle' },
          }
        }

        const result = addDraftStep(current.draft, descriptor)
        return {
          ...current,
          draft: result.draft,
          selectedStepId: result.step.id,
          save: { status: 'dirty' },
          interaction: { status: 'idle' },
        }
      })
    },
    [updateReady],
  )

  const handlePageChanged = useCallback(
    async (pathname: string, title: string, senderTabId?: number) => {
      const current = stateRef.current

      if (
        current.status !== 'ready' ||
        (senderTabId !== undefined && senderTabId !== current.context.tabId) ||
        pathname === current.context.pathname
      ) {
        return
      }

      const nextContext = createNextContext(current.context, pathname, title)

      if (current.interaction.status !== 'waiting_navigation') {
        setState({
          ...current,
          context: nextContext,
          interaction: { status: 'idle' },
          routeChange: nextContext,
        })
        return
      }

      const draftWithNavigation = updateDraftStep(
        current.draft,
        current.interaction.stepId,
        { nextUrl: pathname },
      )
      const savingState: ReadyWorkspace = {
        ...current,
        draft: draftWithNavigation,
        context: nextContext,
        save: { status: 'saving' },
        interaction: { status: 'idle' },
      }
      setState(savingState)

      try {
        const repository =
          repositoryRef.current ?? createRepository(current.settings)
        await repository.saveDraft(draftWithNavigation)
        await loadPage(current.settings, nextContext, { createWhenEmpty: true })
      } catch (error) {
        setState({
          ...savingState,
          save: { status: 'error', message: getErrorMessage(error) },
          runtimeNotice:
            'Переход найден, но предыдущий сценарий не удалось сохранить',
        })
      }
    },
    [createRepository, loadPage],
  )

  useEffect(() => {
    const listener = (
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
    ) => {
      if (message.type === 'ELEMENT_SELECTED') {
        applySelectedElement(message.element)
      } else if (message.type === 'PICKER_CANCEL') {
        updateReady((current) => ({
          ...current,
          interaction: { status: 'idle' },
        }))
      } else if (message.type === 'PAGE_CHANGED') {
        void handlePageChanged(
          message.pathname,
          message.title,
          sender.tab?.id,
        )
      } else if (message.type === 'TARGET_NOT_FOUND') {
        updateReady((current) => ({
          ...current,
          runtimeNotice: `Элемент не найден: ${message.selector}`,
        }))
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [applySelectedElement, handlePageChanged, updateReady])

  async function startPicker(mode: 'new' | 'retarget', stepId?: string) {
    const current = stateRef.current

    if (
      current.status !== 'ready' ||
      current.context.pathname !== current.draft.url
    ) {
      return
    }

    updateReady((workspace) => ({
      ...workspace,
      interaction: { status: 'picking', mode, stepId },
      runtimeNotice: undefined,
    }))

    try {
      await sendMessageToTab(current.context.tabId, { type: 'PICKER_START' })
    } catch (error) {
      updateReady((workspace) => ({
        ...workspace,
        interaction: { status: 'idle' },
        runtimeNotice: getErrorMessage(error),
      }))
    }
  }

  async function stopInteraction() {
    const current = stateRef.current

    if (current.status !== 'ready') {
      return
    }

    await sendMessageToTab(current.context.tabId, { type: 'PREVIEW_STOP' }).catch(
      () => undefined,
    )
    await sendMessageToTab(current.context.tabId, { type: 'PICKER_CANCEL' }).catch(
      () => undefined,
    )
    updateReady((workspace) => ({
      ...workspace,
      interaction: { status: 'idle' },
    }))
  }

  async function preview(scope: 'step' | 'scenario') {
    const current = stateRef.current

    if (
      current.status !== 'ready' ||
      current.context.pathname !== current.draft.url
    ) {
      return
    }

    const selectedStep = current.draft.steps.find(
      (step) => step.id === current.selectedStepId,
    )
    const steps = scope === 'step' && selectedStep
      ? [selectedStep]
      : current.draft.steps

    if (steps.length === 0) {
      return
    }

    await sendMessageToTab(current.context.tabId, {
      type: 'PREVIEW_START',
      config: {
        projectKey: current.settings.projectKey,
        pageUrl: current.draft.url,
        steps: steps.map(({ id, selector, title, body, order }) => ({
          id,
          selector,
          title,
          body,
          order,
        })),
      },
    })
    updateReady((workspace) => ({
      ...workspace,
      interaction: { status: 'previewing', scope },
      runtimeNotice: undefined,
    }))
  }

  async function saveDraft() {
    const current = stateRef.current

    if (current.status !== 'ready') {
      return
    }

    const selectedIndex = current.draft.steps.findIndex(
      (step) => step.id === current.selectedStepId,
    )
    updateReady((workspace) => ({
      ...workspace,
      save: { status: 'saving' },
    }))

    try {
      const repository =
        repositoryRef.current ?? createRepository(current.settings)
      const persistedDraft = await repository.saveDraft(current.draft)
      const selectedStepId =
        persistedDraft.steps[selectedIndex]?.id ?? persistedDraft.steps[0]?.id

      setState({
        ...current,
        draft: persistedDraft,
        selectedStepId,
        save: { status: 'saved' },
        interaction: { status: 'idle' },
        runtimeNotice: undefined,
      })
    } catch (error) {
      updateReady((workspace) => ({
        ...workspace,
        save: { status: 'error', message: getErrorMessage(error) },
      }))
    }
  }

  const selectedStep =
    state.status === 'ready'
      ? state.draft.steps.find((step) => step.id === state.selectedStepId)
      : undefined

  return {
    state,
    selectedStep,
    updateSettingsForm: (patch: Partial<ExtensionSettings>) => {
      setState((current) =>
        current.status === 'setup'
          ? { ...current, form: { ...current.form, ...patch }, error: undefined }
          : current,
      )
    },
    saveSettings: async () => {
      const current = stateRef.current

      if (current.status !== 'setup' || !current.context) {
        return
      }

      try {
        const settings = normalizeSettings(current.form)
        await requestPlatformPermission(settings.platformUrl)
        await storage.setSettings(settings)
        createRepository(settings)
        await loadPage(settings, current.context)
      } catch (error) {
        setState({ ...current, error: getErrorMessage(error) })
      }
    },
    openSettings: () => {
      const current = stateRef.current

      if (current.status === 'ready' || current.status === 'empty') {
        setState({
          status: 'setup',
          context: current.context,
          form: current.settings,
          previousSettings: current.settings,
        })
      }
    },
    cancelSettings: () => {
      const current = stateRef.current

      if (
        current.status === 'setup' &&
        current.previousSettings &&
        current.context
      ) {
        createRepository(current.previousSettings)
        void loadPage(current.previousSettings, current.context)
      }
    },
    createDraft: () => {
      const current = stateRef.current

      if (current.status !== 'empty') {
        return
      }

      setState({
        status: 'ready',
        settings: current.settings,
        context: current.context,
        draft: createLocalScenarioDraft(
          current.projectId,
          current.context.pathname,
          current.context.title,
        ),
        hasPublishedScenario: current.hasPublishedScenario,
        save: { status: 'dirty' },
        interaction: { status: 'idle' },
      })
    },
    updateScenarioName: (name: string) => {
      updateReady((current) => ({
        ...current,
        draft: { ...current.draft, name },
        save: { status: 'dirty' },
      }))
    },
    updateStep: (patch: Partial<StepDraft>) => {
      updateReady((current) =>
        current.selectedStepId
          ? {
              ...current,
              draft: updateDraftStep(
                current.draft,
                current.selectedStepId,
                patch,
              ),
              save: { status: 'dirty' },
            }
          : current,
      )
    },
    selectStep: (stepId: string) =>
      updateReady((current) => ({ ...current, selectedStepId: stepId })),
    addStep: () => void startPicker('new'),
    retargetStep: () => {
      const current = stateRef.current

      if (current.status === 'ready' && current.selectedStepId) {
        void startPicker('retarget', current.selectedStepId)
      }
    },
    deleteStep: () => {
      updateReady((current) => {
        if (!current.selectedStepId) {
          return current
        }

        const draft = deleteDraftStep(current.draft, current.selectedStepId)
        return {
          ...current,
          draft,
          selectedStepId: draft.steps[0]?.id,
          save: { status: 'dirty' },
        }
      })
    },
    moveStep: (direction: -1 | 1) => {
      updateReady((current) =>
        current.selectedStepId
          ? {
              ...current,
              draft: moveDraftStep(
                current.draft,
                current.selectedStepId,
                direction,
              ),
              save: { status: 'dirty' },
            }
          : current,
      )
    },
    saveDraft,
    previewStep: () => void preview('step'),
    previewScenario: () => void preview('scenario'),
    stopInteraction: () => void stopInteraction(),
    waitForNextPage: () => {
      updateReady((current) =>
        current.selectedStepId
          ? {
              ...current,
              interaction: {
                status: 'waiting_navigation',
                stepId: current.selectedStepId,
              },
              runtimeNotice: undefined,
            }
          : current,
      )
    },
    switchToChangedPage: () => {
      const current = stateRef.current

      if (current.status === 'ready' && current.routeChange) {
        void loadPage(current.settings, current.routeChange)
      }
    },
    keepCurrentDraft: () =>
      updateReady((current) => ({ ...current, routeChange: undefined })),
    openAdmin: () => {
      const current = stateRef.current

      if (current.status === 'ready' && current.draft.id) {
        const url = new URL('/admin', current.settings.platformUrl)
        url.searchParams.set('scenarioId', current.draft.id)
        void chrome.tabs.create({ url: url.toString() })
      }
    },
    retry: () => {
      const current = stateRef.current

      if (current.status === 'error' && current.settings && current.context) {
        createRepository(current.settings)
        void loadPage(current.settings, current.context)
      }
    },
  }
}

function createNextContext(
  context: TabContext,
  pathname: string,
  title: string,
): TabContext {
  return {
    ...context,
    pathname,
    title,
    url: new URL(pathname, context.origin).toString(),
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Неизвестная ошибка'
}
