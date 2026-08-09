import { useEffect } from 'react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import {
  downloadScenarioAnalyticsReport,
  loadScenarioAnalytics,
  resetScenarioAnalytics,
  type AnalyticsRepositoryServices,
  type ScenarioAnalyticsState,
} from '../model/scenarioAnalyticsSlice'

type ScenarioAnalyticsRootState = {
  scenarioAnalytics: ScenarioAnalyticsState
}

type ScenarioAnalyticsDispatch = ThunkDispatch<
  ScenarioAnalyticsRootState,
  AnalyticsRepositoryServices,
  UnknownAction
>

const useScenarioAnalyticsDispatch =
  useDispatch.withTypes<ScenarioAnalyticsDispatch>()
const useScenarioAnalyticsSelector =
  useSelector.withTypes<ScenarioAnalyticsRootState>()

export function useScenarioAnalytics() {
  const dispatch = useScenarioAnalyticsDispatch()
  const state = useScenarioAnalyticsSelector(
    (rootState) => rootState.scenarioAnalytics,
  )

  useEffect(() => {
    if (state.workspace.status === 'idle') {
      void dispatch(loadScenarioAnalytics())
    }
  }, [dispatch, state.workspace.status])

  return {
    reportState: state.report,
    source: state.source,
    workspace: state.workspace,
    downloadReport: () => {
      void dispatch(downloadScenarioAnalyticsReport())
    },
    refreshAnalytics: () => {
      const scenarioId =
        state.workspace.status === 'success'
          ? state.workspace.data.selectedScenarioId
          : undefined

      void dispatch(loadScenarioAnalytics(scenarioId))
    },
    resetAnalytics: () => {
      void dispatch(resetScenarioAnalytics())
    },
    selectScenario: (scenarioId: string) => {
      void dispatch(loadScenarioAnalytics(scenarioId))
    },
  }
}
