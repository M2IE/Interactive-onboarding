import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type {
  OnboardingScenario,
  OnboardingStep,
} from '@m2ie/onboarding-sdk'
import type { ScenarioRepositoryServices } from '../api/types'

type ScenarioEditorOperation =
  | 'load'
  | 'create'
  | 'add_step'
  | 'save'
  | 'publish'
  | 'unpublish'
  | 'reset'

export type ScenarioEditorWorkflow =
  | { status: 'idle' }
  | { status: 'loading'; operation: ScenarioEditorOperation }
  | { status: 'ready' }
  | { status: 'published'; scenarioId: string }
  | { status: 'error'; operation: ScenarioEditorOperation; message: string }

export type ScenarioEditorState = {
  scenarios: OnboardingScenario[]
  selectedScenarioId?: string
  selectedStepId?: string
  workflow: ScenarioEditorWorkflow
}

type UpdateScenarioMetaPayload = {
  scenarioId: string
  patch: Pick<Partial<OnboardingScenario>, 'name' | 'description' | 'url'>
}

type UpdateStepPayload = {
  scenarioId: string
  stepId: string
  patch: Partial<OnboardingStep>
}

type ThunkConfig = {
  extra: ScenarioRepositoryServices
  rejectValue: string
}

export const loadScenarios = createAsyncThunk<
  OnboardingScenario[],
  void,
  ThunkConfig
>('scenarioEditor/load', async (_, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.listScenarios()
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const createScenario = createAsyncThunk<
  OnboardingScenario,
  void,
  ThunkConfig
>('scenarioEditor/create', async (_, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.createScenario()
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const addScenarioStep = createAsyncThunk<
  OnboardingScenario,
  OnboardingScenario,
  ThunkConfig
>('scenarioEditor/addStep', async (scenario, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.addStep(scenario)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const saveScenario = createAsyncThunk<
  OnboardingScenario,
  OnboardingScenario,
  ThunkConfig
>('scenarioEditor/save', async (scenario, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.saveScenario(scenario)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const publishScenario = createAsyncThunk<
  OnboardingScenario,
  OnboardingScenario,
  ThunkConfig
>('scenarioEditor/publish', async (scenario, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.publishScenario(scenario)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const unpublishScenario = createAsyncThunk<
  OnboardingScenario,
  OnboardingScenario,
  ThunkConfig
>('scenarioEditor/unpublish', async (scenario, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.unpublishScenario(scenario)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const resetScenarios = createAsyncThunk<
  OnboardingScenario[],
  void,
  ThunkConfig
>('scenarioEditor/reset', async (_, { extra, rejectWithValue }) => {
  try {
    return await extra.scenarioRepository.resetScenarios()
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export function buildInitialScenarioEditorState(
  scenarios: OnboardingScenario[] = [],
): ScenarioEditorState {
  const firstScenario = scenarios[0]

  return {
    scenarios,
    selectedScenarioId: firstScenario?.id,
    selectedStepId: firstScenario?.steps[0]?.id,
    workflow: scenarios.length > 0 ? { status: 'ready' } : { status: 'idle' },
  }
}

const scenarioEditorSlice = createSlice({
  name: 'scenarioEditor',
  initialState: buildInitialScenarioEditorState(),
  reducers: {
    selectScenario(state, action: PayloadAction<string>) {
      const scenario = state.scenarios.find((item) => item.id === action.payload)

      if (!scenario) {
        state.workflow = {
          status: 'error',
          operation: 'load',
          message: 'Сценарий не найден',
        }
        return
      }

      state.selectedScenarioId = scenario.id
      state.selectedStepId = scenario.steps[0]?.id
      state.workflow = { status: 'ready' }
    },
    selectStep(state, action: PayloadAction<string>) {
      state.selectedStepId = action.payload
    },
    updateScenarioMeta(
      state,
      action: PayloadAction<UpdateScenarioMetaPayload>,
    ) {
      const scenario = state.scenarios.find(
        (item) => item.id === action.payload.scenarioId,
      )

      if (scenario) {
        applyScenarioPatch(scenario, action.payload.patch)
      }
    },
    updateStep(state, action: PayloadAction<UpdateStepPayload>) {
      const scenario = state.scenarios.find(
        (item) => item.id === action.payload.scenarioId,
      )
      const step = scenario?.steps.find(
        (item) => item.id === action.payload.stepId,
      )

      if (scenario && step) {
        Object.assign(step, action.payload.patch)
        markScenarioDraft(scenario)
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadScenarios.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'load' }
      })
      .addCase(loadScenarios.fulfilled, (state, action) => {
        replaceWorkspace(state, action.payload)
      })
      .addCase(loadScenarios.rejected, (state, action) => {
        setError(state, 'load', action.payload)
      })
      .addCase(createScenario.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'create' }
      })
      .addCase(createScenario.fulfilled, (state, action) => {
        state.scenarios.unshift(action.payload)
        state.selectedScenarioId = action.payload.id
        state.selectedStepId = action.payload.steps[0]?.id
        state.workflow = { status: 'ready' }
      })
      .addCase(createScenario.rejected, (state, action) => {
        setError(state, 'create', action.payload)
      })
      .addCase(addScenarioStep.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'add_step' }
      })
      .addCase(addScenarioStep.fulfilled, (state, action) => {
        replaceScenario(state, action.payload)
        state.selectedStepId = action.payload.steps.at(-1)?.id
        state.workflow = { status: 'ready' }
      })
      .addCase(addScenarioStep.rejected, (state, action) => {
        setError(state, 'add_step', action.payload)
      })
      .addCase(saveScenario.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'save' }
      })
      .addCase(saveScenario.fulfilled, (state, action) => {
        replaceScenario(state, action.payload)
        state.workflow = { status: 'ready' }
      })
      .addCase(saveScenario.rejected, (state, action) => {
        setError(state, 'save', action.payload)
      })
      .addCase(publishScenario.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'publish' }
      })
      .addCase(publishScenario.fulfilled, (state, action) => {
        removeSupersededPublishedScenario(state, action.payload)
        replaceScenario(state, action.payload)
        state.workflow = {
          status: 'published',
          scenarioId: action.payload.id,
        }
      })
      .addCase(publishScenario.rejected, (state, action) => {
        setError(state, 'publish', action.payload)
      })
      .addCase(unpublishScenario.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'unpublish' }
      })
      .addCase(unpublishScenario.fulfilled, (state, action) => {
        removeArchivedScenarioCopies(state, action.payload)
        replaceScenario(state, action.payload)
        state.workflow = { status: 'ready' }
      })
      .addCase(unpublishScenario.rejected, (state, action) => {
        setError(state, 'unpublish', action.payload)
      })
      .addCase(resetScenarios.pending, (state) => {
        state.workflow = { status: 'loading', operation: 'reset' }
      })
      .addCase(resetScenarios.fulfilled, (state, action) => {
        replaceWorkspace(state, action.payload)
      })
      .addCase(resetScenarios.rejected, (state, action) => {
        setError(state, 'reset', action.payload)
      })
  },
})

function applyScenarioPatch(
  scenario: OnboardingScenario,
  patch: UpdateScenarioMetaPayload['patch'],
) {
  Object.assign(scenario, patch)
  markScenarioDraft(scenario)
}

function markScenarioDraft(scenario: OnboardingScenario) {
  if (scenario.status === 'published') {
    scenario.status = 'draft'
  }

  scenario.updatedAt = new Date().toISOString()
}

function replaceWorkspace(
  state: ScenarioEditorState,
  scenarios: OnboardingScenario[],
) {
  const selected = scenarios.find(
    (scenario) => scenario.id === state.selectedScenarioId,
  )
  const nextSelected = selected ?? scenarios[0]

  state.scenarios = scenarios
  state.selectedScenarioId = nextSelected?.id
  state.selectedStepId = nextSelected?.steps[0]?.id
  state.workflow = { status: 'ready' }
}

function replaceScenario(
  state: ScenarioEditorState,
  scenario: OnboardingScenario,
) {
  const index = state.scenarios.findIndex((item) => item.id === scenario.id)

  if (index === -1) {
    state.scenarios.unshift(scenario)
  } else {
    state.scenarios[index] = scenario
  }

  state.selectedScenarioId = scenario.id
  if (!scenario.steps.some((step) => step.id === state.selectedStepId)) {
    state.selectedStepId = scenario.steps[0]?.id
  }
}

function removeSupersededPublishedScenario(
  state: ScenarioEditorState,
  scenario: OnboardingScenario,
) {
  state.scenarios = state.scenarios.filter(
    (item) =>
      item.id === scenario.id ||
      item.status !== 'published' ||
      item.projectId !== scenario.projectId ||
      item.url !== scenario.url,
  )
}

function removeArchivedScenarioCopies(
  state: ScenarioEditorState,
  scenario: OnboardingScenario,
) {
  state.scenarios = state.scenarios.filter(
    (item) =>
      item.id === scenario.id ||
      item.projectId !== scenario.projectId ||
      item.url !== scenario.url,
  )
}

function setError(
  state: ScenarioEditorState,
  operation: ScenarioEditorOperation,
  message?: string,
) {
  state.workflow = {
    status: 'error',
    operation,
    message: message ?? 'Не удалось выполнить запрос',
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Неизвестная ошибка API'
}

export const { selectScenario, selectStep, updateScenarioMeta, updateStep } =
  scenarioEditorSlice.actions

export const scenarioEditorReducer = scenarioEditorSlice.reducer
