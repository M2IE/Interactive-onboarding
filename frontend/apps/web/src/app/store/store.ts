import { configureStore } from '@reduxjs/toolkit'
import { scenarioAnalyticsReducer } from '@/features/scenario-analytics'
import { scenarioEditorReducer } from '@/features/scenario-editor/model/scenarioEditorSlice'
import type { AppServices } from '@/app/services/createAppServices'

export function createAppStore(services: AppServices) {
  return configureStore({
    reducer: {
      scenarioAnalytics: scenarioAnalyticsReducer,
      scenarioEditor: scenarioEditorReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: services } }),
  })
}

export type AppStore = ReturnType<typeof createAppStore>

export type RootState = ReturnType<AppStore['getState']>

export type AppDispatch = AppStore['dispatch']
