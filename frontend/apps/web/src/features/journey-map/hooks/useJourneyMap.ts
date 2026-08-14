import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { appRoutes } from '@/shared/config/routes'
import type { JourneyRepositoryServices } from '../api/types'
import {
  loadJourneyMap,
  loadJourneyMetrics,
  selectJourneyNode,
  setJourneySearch,
} from '../model/journeyMapSlice'
import type { JourneyMapState } from '../model/types'

type JourneyRootState = { journeyMap: JourneyMapState }
type JourneyDispatch = ThunkDispatch<
  JourneyRootState,
  JourneyRepositoryServices,
  UnknownAction
>
const useJourneyDispatch = useDispatch.withTypes<JourneyDispatch>()
const useJourneySelector = useSelector.withTypes<JourneyRootState>()

export function useJourneyMap() {
  const dispatch = useJourneyDispatch()
  const navigate = useNavigate()
  const state = useJourneySelector((root) => root.journeyMap)

  useEffect(() => {
    if (state.graph.status === 'idle') void dispatch(loadJourneyMap())
  }, [dispatch, state.graph.status])

  useEffect(() => {
    if (state.graph.status === 'success' && Object.keys(state.metrics).length === 0) {
      void dispatch(loadJourneyMetrics())
    }
  }, [dispatch, state.graph.status, state.metrics])

  const selectedNode = state.graph.status === 'success'
    ? state.graph.data.nodes.find((node) => node.id === state.selectedNodeId)
    : undefined
  const visibleNodeIds = useMemo(() => {
    if (state.graph.status !== 'success' || !state.search.trim()) return undefined
    const query = state.search.trim().toLocaleLowerCase('ru')
    return new Set(
      state.graph.data.nodes
        .filter((node) => `${node.name} ${node.path}`.toLocaleLowerCase('ru').includes(query))
        .map((node) => node.id),
    )
  }, [state.graph, state.search])

  return {
    ...state,
    selectedNode,
    visibleNodeIds,
    refresh: () => void dispatch(loadJourneyMap()),
    selectNode: (nodeId?: string) => dispatch(selectJourneyNode(nodeId)),
    setSearch: (search: string) => dispatch(setJourneySearch(search)),
    openSelectedScenario: () => {
      if (selectedNode?.scenario) {
        navigate(`${appRoutes.admin}?scenarioId=${selectedNode.scenario.id}`)
      }
    },
  }
}
