import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, jest } from '@jest/globals'
import type { AnalyticsRepository } from './types'
import {
  loadScenarioAnalytics,
  scenarioAnalyticsReducer,
} from './scenarioAnalyticsSlice'

describe('scenario analytics slice', () => {
  it('models loading and an empty successful response explicitly', async () => {
    let resolveScenarios: (value: []) => void = () => undefined
    const repository = createRepository({
      listScenarios: jest.fn(
        () =>
          new Promise<[]>(resolve => {
            resolveScenarios = resolve
          }),
      ),
    })
    const store = createStore(repository)
    const request = store.dispatch(loadScenarioAnalytics())

    expect(store.getState().scenarioAnalytics.workspace.status).toBe('loading')

    resolveScenarios([])
    await request

    expect(store.getState().scenarioAnalytics.workspace).toEqual({
      status: 'success',
      data: { scenarios: [] },
    })
  })

  it('stores a backend error without falling back to mock data', async () => {
    const repository = createRepository({
      listScenarios: jest.fn<AnalyticsRepository['listScenarios']>().mockRejectedValue(
        new Error('Backend unavailable'),
      ),
    })
    const store = createStore(repository)

    await store.dispatch(loadScenarioAnalytics())

    expect(store.getState().scenarioAnalytics.workspace).toEqual({
      status: 'error',
      error: 'Backend unavailable',
    })
    expect(repository.getAnalytics).not.toHaveBeenCalled()
  })
})

function createRepository(
  patch: Partial<AnalyticsRepository> = {},
): AnalyticsRepository {
  return {
    source: 'real',
    listScenarios: jest.fn<AnalyticsRepository['listScenarios']>().mockResolvedValue([]),
    getAnalytics: jest.fn<AnalyticsRepository['getAnalytics']>(),
    downloadReport: jest.fn<AnalyticsRepository['downloadReport']>(),
    ...patch,
  }
}

function createStore(analyticsRepository: AnalyticsRepository) {
  return configureStore({
    reducer: { scenarioAnalytics: scenarioAnalyticsReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { analyticsRepository } } }),
  })
}
