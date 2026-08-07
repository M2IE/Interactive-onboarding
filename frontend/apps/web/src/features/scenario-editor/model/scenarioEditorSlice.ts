import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  OnboardingScenario,
  OnboardingStep,
  PageDefinition,
} from '@interactive-onboarding/shared'
import { defaultScenario } from '@/entities/scenario/defaultScenario'
import { readScenarios } from '@/shared/api/mockOnboardingApi'

export type ScenarioEditorWorkflow =
  | { status: 'ready' }
  | { status: 'publishing'; scenarioId: string }
  | { status: 'published'; scenarioId: string; versionId: string }
  | { status: 'error'; message: string }

export type ScenarioEditorState = {
  scenarios: OnboardingScenario[]
  selectedScenarioId?: string
  selectedStepId?: string
  workflow: ScenarioEditorWorkflow
}

type UpdateScenarioMetaPayload = {
  scenarioId: string
  patch: Pick<Partial<OnboardingScenario>, 'name' | 'description'>
}

type UpdateStepPayload = {
  scenarioId: string
  stepId: string
  patch: Partial<OnboardingStep>
}

type AddStepPayload = {
  scenarioId: string
  stepId: string
  createdAt: string
}

type PublishScenarioPayload = {
  scenarioId: string
  publishedAt: string
}

export function buildInitialScenarioEditorState(
  scenarios = readScenarios(),
): ScenarioEditorState {
  const firstScenario = scenarios[0]

  return {
    scenarios,
    selectedScenarioId: firstScenario?.id,
    selectedStepId: firstScenario?.steps[0]?.id,
    workflow: { status: 'ready' },
  }
}

const scenarioEditorSlice = createSlice({
  name: 'scenarioEditor',
  initialState: buildInitialScenarioEditorState(),
  reducers: {
    selectScenario(state, action: PayloadAction<string>) {
      const scenario = state.scenarios.find((item) => item.id === action.payload)

      if (!scenario) {
        state.workflow = { status: 'error', message: 'Сценарий не найден' }
        return
      }

      state.selectedScenarioId = scenario.id
      state.selectedStepId = scenario.steps[0]?.id
      state.workflow = { status: 'ready' }
    },
    selectStep(state, action: PayloadAction<string>) {
      state.selectedStepId = action.payload
    },
    createDraft: {
      reducer(state, action: PayloadAction<OnboardingScenario>) {
        state.scenarios.unshift(action.payload)
        state.selectedScenarioId = action.payload.id
        state.selectedStepId = action.payload.steps[0]?.id
        state.workflow = { status: 'ready' }
      },
      prepare() {
        return { payload: createScenarioDraft(new Date()) }
      },
    },
    restoreDemoScenario(state) {
      state.scenarios = [defaultScenario]
      state.selectedScenarioId = defaultScenario.id
      state.selectedStepId = defaultScenario.steps[0]?.id
      state.workflow = { status: 'ready' }
    },
    updateScenarioMeta(
      state,
      action: PayloadAction<UpdateScenarioMetaPayload>,
    ) {
      const scenario = state.scenarios.find(
        (item) => item.id === action.payload.scenarioId,
      )

      if (!scenario) {
        return
      }

      applyScenarioPatch(scenario, action.payload.patch)
    },
    updateStep(state, action: PayloadAction<UpdateStepPayload>) {
      const scenario = state.scenarios.find(
        (item) => item.id === action.payload.scenarioId,
      )

      if (!scenario) {
        return
      }

      const step = scenario.steps.find(
        (item) => item.id === action.payload.stepId,
      )

      if (!step) {
        return
      }

      applyStepPatch(step, action.payload.patch, scenario.pages)
      markScenarioDraft(scenario)
    },
    addStep: {
      reducer(state, action: PayloadAction<AddStepPayload>) {
        const scenario = state.scenarios.find(
          (item) => item.id === action.payload.scenarioId,
        )

        if (!scenario) {
          return
        }

        const step = createStep(scenario, action.payload)
        scenario.steps.push(step)
        state.selectedStepId = step.id
        markScenarioDraft(scenario)
      },
      prepare(scenarioId: string) {
        return {
          payload: {
            scenarioId,
            stepId: `step-${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
        }
      },
    },
    publishScenario: {
      reducer(state, action: PayloadAction<PublishScenarioPayload>) {
        const scenario = state.scenarios.find(
          (item) => item.id === action.payload.scenarioId,
        )

        if (!scenario) {
          state.workflow = { status: 'error', message: 'Сценарий не найден' }
          return
        }

        state.workflow = {
          status: 'publishing',
          scenarioId: action.payload.scenarioId,
        }

        const nextVersion = scenario.version + 1
        const versionId = `${scenario.id}-v${nextVersion}`

        scenario.status = 'published'
        scenario.version = nextVersion
        scenario.versionId = versionId
        scenario.publishedAt = action.payload.publishedAt
        scenario.updatedAt = action.payload.publishedAt
        scenario.steps.forEach((step) => {
          step.versionId = versionId
        })

        state.workflow = {
          status: 'published',
          scenarioId: scenario.id,
          versionId,
        }
      },
      prepare(scenarioId: string) {
        return {
          payload: {
            scenarioId,
            publishedAt: new Date().toISOString(),
          },
        }
      },
    },
    resetWorkflow(state) {
      state.workflow = { status: 'ready' }
    },
  },
})

function applyScenarioPatch(
  scenario: OnboardingScenario,
  patch: UpdateScenarioMetaPayload['patch'],
) {
  if (patch.name !== undefined) {
    scenario.name = patch.name
  }

  if (patch.description !== undefined) {
    scenario.description = patch.description
  }

  markScenarioDraft(scenario)
}

function applyStepPatch(
  step: OnboardingStep,
  patch: Partial<OnboardingStep>,
  pages: PageDefinition[],
) {
  Object.assign(step, patch)

  if (patch.pagePath) {
    const page = pages.find((item) => item.path === patch.pagePath)

    if (page) {
      step.pageId = page.id
    }
  }
}

function markScenarioDraft(scenario: OnboardingScenario) {
  if (scenario.status === 'published') {
    scenario.status = 'draft'
  }

  scenario.updatedAt = new Date().toISOString()
}

function createScenarioDraft(now: Date): OnboardingScenario {
  const timestamp = now.getTime()
  const isoDate = now.toISOString()
  const versionId = `scenario-draft-${timestamp}-v1`

  return {
    ...defaultScenario,
    id: `scenario-${timestamp}`,
    name: 'Новый сценарий онбординга',
    description: 'Черновик сценария для новой точки входа',
    status: 'draft',
    version: 1,
    versionId,
    createdAt: isoDate,
    updatedAt: isoDate,
    publishedAt: undefined,
    steps: defaultScenario.steps.map((step, index) => ({
      ...step,
      id: `draft-step-${timestamp}-${index}`,
      versionId,
    })),
  }
}

function createStep(
  scenario: OnboardingScenario,
  payload: AddStepPayload,
): OnboardingStep {
  const fallbackPage = scenario.pages[0] ?? defaultScenario.pages[0]
  const nextOrder =
    scenario.steps.length === 0
      ? 1
      : Math.max(...scenario.steps.map((item) => item.order)) + 1

  return {
    id: payload.stepId,
    versionId: scenario.versionId,
    pageId: fallbackPage.id,
    pagePath: fallbackPage.path,
    order: nextOrder,
    selector: '[data-onboarding-id="profile-create-button"]',
    title: 'Новый шаг',
    body: 'Опишите, какую проблему пользователя решает эта подсказка.',
    placement: 'right',
    completion: 'next_button',
  }
}

export const {
  addStep,
  createDraft,
  publishScenario,
  resetWorkflow,
  restoreDemoScenario,
  selectScenario,
  selectStep,
  updateScenarioMeta,
  updateStep,
} = scenarioEditorSlice.actions

export const scenarioEditorReducer = scenarioEditorSlice.reducer
