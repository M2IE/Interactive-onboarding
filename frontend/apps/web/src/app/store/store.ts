import { configureStore } from '@reduxjs/toolkit'
import { scenarioEditorReducer } from '@/features/scenario-editor/model/scenarioEditorSlice'

export const store = configureStore({
  reducer: {
    scenarioEditor: scenarioEditorReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch
