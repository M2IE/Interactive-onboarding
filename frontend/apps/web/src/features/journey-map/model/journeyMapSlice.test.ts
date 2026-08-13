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
})
