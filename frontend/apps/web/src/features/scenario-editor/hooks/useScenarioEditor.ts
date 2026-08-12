import { useEffect } from 'react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import type { OnboardingStep } from '@m2ie/onboarding-sdk'
import { useDispatch, useSelector } from 'react-redux'
import type { ScenarioRepositoryServices } from '../api/types'
import {
  addScenarioStep,
  createScenario,
  loadScenarios,
  publishScenario,
  resetScenarios,
  saveScenario,
  selectScenario,
  selectStep,
  updateScenarioMeta,
  updateStep,
  unpublishScenario,
  type ScenarioEditorState,
} from '../model/scenarioEditorSlice'
import {
  selectActiveScenario,
  selectActiveStep,
  selectScenarios,
  selectWorkflow,
} from '../model/selectors'
import { resolveScenarioDeepLink } from '../model/deepLink'
import { validateScenario } from '../model/scenarioValidation'
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges'

type ScenarioEditorRootState = {
  scenarioEditor: ScenarioEditorState
}

type ScenarioEditorDispatch = ThunkDispatch<
  ScenarioEditorRootState,
  ScenarioRepositoryServices,
  UnknownAction
>

const useScenarioEditorDispatch = useDispatch.withTypes<ScenarioEditorDispatch>()
const useScenarioEditorSelector =
  useSelector.withTypes<ScenarioEditorRootState>()

export function useScenarioEditor(requestedScenarioId?: string | null) {
  const dispatch = useScenarioEditorDispatch()
  const scenarios = useScenarioEditorSelector((state) =>
    selectScenarios(state.scenarioEditor),
  )
  const activeScenario = useScenarioEditorSelector((state) =>
    selectActiveScenario(state.scenarioEditor),
  )
  const activeStep = useScenarioEditorSelector((state) =>
    selectActiveStep(state.scenarioEditor),
  )
  const workflow = useScenarioEditorSelector((state) =>
    selectWorkflow(state.scenarioEditor),
  )
  const dirtyScenarioIds = useScenarioEditorSelector(
    (state) => state.scenarioEditor.dirtyScenarioIds,
  )

  useEffect(() => {
    if (workflow.status === 'idle') {
      void dispatch(loadScenarios())
    }
  }, [dispatch, workflow.status])

  const deepLinkResolution = resolveScenarioDeepLink(
    scenarios,
    requestedScenarioId,
  )

  useEffect(() => {
    if (
      deepLinkResolution.status === 'found' &&
      activeScenario?.id !== deepLinkResolution.scenarioId
    ) {
      dispatch(selectScenario(deepLinkResolution.scenarioId))
    }
  }, [activeScenario?.id, deepLinkResolution, dispatch])

  const isPublished = activeScenario?.status === 'published'
  const isArchived = activeScenario?.status === 'archived'
  const isReadOnly = isPublished || isArchived
  const isDirty = activeScenario
    ? dirtyScenarioIds.includes(activeScenario.id)
    : false
  const validation = activeScenario
    ? validateScenario(activeScenario)
    : undefined
  const confirmDiscard = useUnsavedChanges(isDirty)

  return {
    activeScenario,
    activeStep,
    isBusy: workflow.status === 'loading',
    isDirty,
    isArchived,
    isPublished,
    isReadOnly,
    scenarios,
    workflow,
    validation,
    deepLinkNotice:
      (workflow.status === 'ready' || workflow.status === 'published') &&
      deepLinkResolution.status === 'missing'
        ? 'Сценарий из ссылки не найден или недоступен в текущем проекте.'
        : undefined,
    addStep: () => {
      if (activeScenario && !isReadOnly) {
        void dispatch(addScenarioStep(activeScenario))
      }
    },
    createDraft: () => {
      if (confirmDiscard()) {
        void dispatch(createScenario())
      }
    },
    publishActiveScenario: () => {
      if (
        activeScenario &&
        !isReadOnly &&
        validation?.status === 'valid'
      ) {
        void dispatch(publishScenario(activeScenario))
      }
    },
    unpublishActiveScenario: () => {
      if (activeScenario && isPublished) {
        void dispatch(unpublishScenario(activeScenario))
      }
    },
    reloadScenarios: () => {
      if (confirmDiscard()) {
        void dispatch(resetScenarios())
      }
    },
    saveActiveScenario: () => {
      if (activeScenario && !isReadOnly) {
        void dispatch(saveScenario(activeScenario))
      }
    },
    selectScenario: (scenarioId: string) => {
      if (scenarioId !== activeScenario?.id && confirmDiscard()) {
        dispatch(selectScenario(scenarioId))
      }
    },
    selectStep: (stepId: string) => dispatch(selectStep(stepId)),
    updateScenarioMeta: (patch: {
      name?: string
      description?: string
      url?: string
    }) => {
      if (activeScenario && !isReadOnly) {
        dispatch(updateScenarioMeta({ scenarioId: activeScenario.id, patch }))
      }
    },
    updateStep: (patch: Partial<OnboardingStep>) => {
      if (activeScenario && activeStep && !isReadOnly) {
        dispatch(
          updateStep({
            scenarioId: activeScenario.id,
            stepId: activeStep.id,
            patch,
          }),
        )
      }
    },
  }
}
