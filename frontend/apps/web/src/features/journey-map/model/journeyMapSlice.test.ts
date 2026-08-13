import { configureStore } from '@reduxjs/toolkit'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import {
  journeyMapReducer,
  loadJourneyMap,
  loadJourneyMetrics,
} from './journeyMapSlice'

describe('journeyMapSlice', () => {
  it('loads topology before metrics and preserves partial metric errors', async () => {
    const repository = {
      source: 'mock' as const,
      listPublishedScenarios: jest.fn().mockResolvedValue(defaultScenarios.slice(0, 2)),
      getMetrics: jest.fn().mockImplementation(async (scenario) => {
        if (scenario.id === defaultScenarios[0].id) {
          return { views: 12, completed: 8, conversion: 67 }
        }
        throw new Error('offline')
      }),
    }
    const store = configureStore({
      reducer: { journeyMap: journeyMapReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ thunk: { extraArgument: { journeyRepository: repository } } }),
    })

    await store.dispatch(loadJourneyMap())
    expect(store.getState().journeyMap.graph.status).toBe('success')

    await store.dispatch(loadJourneyMetrics())
    expect(store.getState().journeyMap.metrics[defaultScenarios[0].id].status).toBe('success')
    expect(store.getState().journeyMap.metrics[defaultScenarios[1].id]).toEqual({
      status: 'error',
      error: 'offline',
    })
  })

  it('ignores metrics returned for a graph that was refreshed', async () => {
    let resolveMetrics: ((value: { views: number; completed: number; conversion: number }) => void) | undefined
    const repository = {
      source: 'mock' as const,
      listPublishedScenarios: jest
        .fn()
        .mockResolvedValueOnce([defaultScenarios[0]])
        .mockResolvedValueOnce([defaultScenarios[1]]),
      getMetrics: jest.fn().mockImplementation(
        () => new Promise((resolve) => { resolveMetrics = resolve }),
      ),
    }
    const store = configureStore({
      reducer: { journeyMap: journeyMapReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ thunk: { extraArgument: { journeyRepository: repository } } }),
    })

    await store.dispatch(loadJourneyMap())
    const staleMetrics = store.dispatch(loadJourneyMetrics())
    await store.dispatch(loadJourneyMap())
    resolveMetrics?.({ views: 100, completed: 90, conversion: 90 })
    await staleMetrics

    expect(store.getState().journeyMap.metrics).toEqual({})
    expect(store.getState().journeyMap.graph.status).toBe('success')
    expect(
      store.getState().journeyMap.graph.status === 'success'
        ? store.getState().journeyMap.graph.data.nodes[0]?.id
        : undefined,
    ).toBe(defaultScenarios[1].id)
  })
})
