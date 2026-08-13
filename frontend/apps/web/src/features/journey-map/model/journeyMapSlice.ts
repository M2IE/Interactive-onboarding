import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { errorState, idleState, loadingState, successState } from '@/shared/lib/asyncState'
import type { JourneyRepositoryServices } from '../api/types'
import { buildJourneyGraph } from './graph'
import type { JourneyMapState, JourneyMetrics } from './types'

type JourneyRootState = { journeyMap: JourneyMapState }
type RejectValue = { message: string }
type JourneyThunkConfig = {
  extra: JourneyRepositoryServices
  state: JourneyRootState
  rejectValue: RejectValue
}

const initialState: JourneyMapState = {
  graph: idleState(),
  metrics: {},
  search: '',
}

export const loadJourneyMap = createAsyncThunk<
  ReturnType<typeof buildJourneyGraph>,
  void,
  JourneyThunkConfig
>('journeyMap/load', async (_, { extra, rejectWithValue }) => {
  try {
    const scenarios = await extra.journeyRepository.listPublishedScenarios()
    return buildJourneyGraph(scenarios)
  } catch (error) {
    return rejectWithValue({ message: getErrorMessage(error, 'Не удалось загрузить карту пути') })
  }
})

export const loadJourneyMetrics = createAsyncThunk<void, void, JourneyThunkConfig>(
  'journeyMap/loadMetrics',
  async (_, { dispatch, extra, getState }) => {
    const graphState = getState().journeyMap.graph
    if (graphState.status !== 'success') return

    const scenarios = graphState.data.nodes.flatMap((node) =>
      node.scenario ? [node.scenario] : [],
    )

    await runWithConcurrency(scenarios, 4, async (scenario) => {
      dispatch(metricRequested(scenario.id))
      try {
        const metrics = await extra.journeyRepository.getMetrics(scenario)
        dispatch(metricReceived({ scenarioId: scenario.id, metrics }))
      } catch (error) {
        dispatch(
          metricFailed({
            scenarioId: scenario.id,
            message: getErrorMessage(error, 'Метрики недоступны'),
          }),
        )
      }
    })
  },
)

const journeyMapSlice = createSlice({
  name: 'journeyMap',
  initialState,
  reducers: {
    selectJourneyNode(state, action: PayloadAction<string | undefined>) {
      state.selectedNodeId = action.payload
    },
    setJourneySearch(state, action: PayloadAction<string>) {
      state.search = action.payload
    },
    metricRequested(state, action: PayloadAction<string>) {
      state.metrics[action.payload] = loadingState()
    },
    metricReceived(
      state,
      action: PayloadAction<{ scenarioId: string; metrics: JourneyMetrics }>,
    ) {
      state.metrics[action.payload.scenarioId] = successState(action.payload.metrics)
    },
    metricFailed(state, action: PayloadAction<{ scenarioId: string; message: string }>) {
      state.metrics[action.payload.scenarioId] = errorState(action.payload.message)
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadJourneyMap.pending, (state) => {
        state.graph = loadingState()
        state.metrics = {}
      })
      .addCase(loadJourneyMap.fulfilled, (state, action) => {
        state.graph = successState(action.payload)
        if (!action.payload.nodes.some((node) => node.id === state.selectedNodeId)) {
          state.selectedNodeId = action.payload.rootIds.length === 1
            ? action.payload.rootIds[0]
            : undefined
        }
      })
      .addCase(loadJourneyMap.rejected, (state, action) => {
        state.graph = errorState(action.payload?.message ?? 'Не удалось загрузить карту пути')
      })
  },
})

export const {
  metricFailed,
  metricReceived,
  metricRequested,
  selectJourneyNode,
  setJourneySearch,
} = journeyMapSlice.actions
export const journeyMapReducer = journeyMapSlice.reducer

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let cursor = 0
  async function runWorker() {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor += 1
      if (item) await worker(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
