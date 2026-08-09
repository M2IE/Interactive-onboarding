import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  errorState,
  idleState,
  loadingState,
  successState,
  type AsyncState,
} from '@/shared/lib/asyncState'
import type {
  AnalyticsRepository,
  AnalyticsScenario,
  AnalyticsSource,
  ScenarioAnalyticsData,
} from './types'

export type AnalyticsWorkspace = {
  scenarios: AnalyticsScenario[]
  selectedScenarioId?: string
  analytics?: ScenarioAnalyticsData
}

type ReportResult = {
  message: string
}

export type ScenarioAnalyticsState = {
  source: AnalyticsSource
  workspace: AsyncState<AnalyticsWorkspace>
  report: AsyncState<ReportResult>
}

export type AnalyticsRepositoryServices = {
  analyticsRepository: AnalyticsRepository
}

type AnalyticsThunkState = {
  scenarioAnalytics: ScenarioAnalyticsState
}

type AnalyticsThunkConfig = {
  extra: AnalyticsRepositoryServices
  state: AnalyticsThunkState
  rejectValue: { source: AnalyticsSource; message: string }
}

const initialState: ScenarioAnalyticsState = {
  source: 'real',
  workspace: idleState(),
  report: idleState(),
}

export const loadScenarioAnalytics = createAsyncThunk<
  { source: AnalyticsSource; workspace: AnalyticsWorkspace },
  string | undefined,
  AnalyticsThunkConfig
>(
  'scenarioAnalytics/load',
  async (preferredScenarioId, { extra, rejectWithValue }) => {
    try {
      return {
        source: extra.analyticsRepository.source,
        workspace: await loadWorkspace(
          extra.analyticsRepository,
          preferredScenarioId,
        ),
      }
    } catch (error) {
      return rejectWithValue({
        source: extra.analyticsRepository.source,
        message: getErrorMessage(error, 'Не удалось загрузить аналитику'),
      })
    }
  },
)

export const downloadScenarioAnalyticsReport = createAsyncThunk<
  ReportResult,
  void,
  AnalyticsThunkConfig
>('scenarioAnalytics/downloadReport', async (_, { extra, getState, rejectWithValue }) => {
  const scenario = getSelectedScenario(getState().scenarioAnalytics)

  if (!scenario) {
    return rejectWithValue({
      source: extra.analyticsRepository.source,
      message: 'Выберите сценарий для формирования отчета',
    })
  }

  try {
    await extra.analyticsRepository.downloadReport(scenario)
    return { message: 'PDF-отчет сформирован и отправлен на скачивание' }
  } catch (error) {
    return rejectWithValue({
      source: extra.analyticsRepository.source,
      message: getErrorMessage(error, 'Не удалось сформировать PDF-отчет'),
    })
  }
})

export const resetScenarioAnalytics = createAsyncThunk<
  { source: AnalyticsSource; workspace: AnalyticsWorkspace },
  void,
  AnalyticsThunkConfig
>('scenarioAnalytics/reset', async (_, { extra, getState, rejectWithValue }) => {
  const selectedScenarioId = getSelectedScenario(
    getState().scenarioAnalytics,
  )?.id

  if (!extra.analyticsRepository.resetAnalytics) {
    return rejectWithValue({
      source: extra.analyticsRepository.source,
      message: 'Очистка недоступна для серверной аналитики',
    })
  }

  try {
    await extra.analyticsRepository.resetAnalytics()
    return {
      source: extra.analyticsRepository.source,
      workspace: await loadWorkspace(
        extra.analyticsRepository,
        selectedScenarioId,
      ),
    }
  } catch (error) {
    return rejectWithValue({
      source: extra.analyticsRepository.source,
      message: getErrorMessage(error, 'Не удалось очистить аналитику'),
    })
  }
})

const scenarioAnalyticsSlice = createSlice({
  name: 'scenarioAnalytics',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadScenarioAnalytics.pending, (state) => {
        state.workspace = loadingState()
      })
      .addCase(loadScenarioAnalytics.fulfilled, (state, action) => {
        state.source = action.payload.source
        state.workspace = successState(action.payload.workspace)
      })
      .addCase(loadScenarioAnalytics.rejected, (state, action) => {
        state.source = action.payload?.source ?? state.source
        state.workspace = errorState(
          action.payload?.message ?? 'Не удалось загрузить аналитику',
        )
      })
      .addCase(resetScenarioAnalytics.pending, (state) => {
        state.workspace = loadingState()
      })
      .addCase(resetScenarioAnalytics.fulfilled, (state, action) => {
        state.source = action.payload.source
        state.workspace = successState(action.payload.workspace)
      })
      .addCase(resetScenarioAnalytics.rejected, (state, action) => {
        state.workspace = errorState(
          action.payload?.message ?? 'Не удалось очистить аналитику',
        )
      })
      .addCase(downloadScenarioAnalyticsReport.pending, (state) => {
        state.report = loadingState()
      })
      .addCase(downloadScenarioAnalyticsReport.fulfilled, (state, action) => {
        state.report = successState(action.payload)
      })
      .addCase(downloadScenarioAnalyticsReport.rejected, (state, action) => {
        state.report = errorState(
          action.payload?.message ?? 'Не удалось сформировать PDF-отчет',
        )
      })
  },
})

async function loadWorkspace(
  repository: AnalyticsRepository,
  preferredScenarioId?: string,
): Promise<AnalyticsWorkspace> {
  const scenarios = await repository.listScenarios()
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === preferredScenarioId) ??
    scenarios[0]

  if (!selectedScenario) {
    return { scenarios: [] }
  }

  return {
    scenarios,
    selectedScenarioId: selectedScenario.id,
    analytics: await repository.getAnalytics(selectedScenario),
  }
}

function getSelectedScenario(state: ScenarioAnalyticsState) {
  if (state.workspace.status !== 'success') {
    return undefined
  }

  const workspace = state.workspace.data

  return workspace.scenarios.find(
    (scenario) => scenario.id === workspace.selectedScenarioId,
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback
  }

  const status = (error as Error & { status?: unknown }).status

  if (typeof status === 'number') {
    return `${fallback}: сервер ответил кодом ${status}`
  }

  return error.message
}

export const scenarioAnalyticsReducer = scenarioAnalyticsSlice.reducer
