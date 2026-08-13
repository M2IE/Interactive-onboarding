import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  createBroadcastChannelLiveSessionTransport,
  type LiveSessionTransport,
} from '@/shared/api/liveSessionTransport'
import {
  failLiveSession,
  markLiveSessionReady,
  receiveLiveSessionEvent,
  setLiveViewport,
  startLiveSession,
  stopLiveSession,
} from '../model/liveSessionSlice'
import type { LiveViewport } from '../model/types'
import type { LiveSessionState } from '../model/types'

type LiveSessionRootState = {
  liveSession: LiveSessionState
}
const useLiveSelector = useSelector.withTypes<LiveSessionRootState>()

export function useLiveSession(terminalScenarioIds: ReadonlySet<string>) {
  const dispatch = useDispatch()
  const state = useLiveSelector((root) => root.liveSession)
  const transportRef = useRef<LiveSessionTransport | null>(null)
  const runId = state.status === 'idle' ? undefined : state.runId

  useEffect(() => {
    transportRef.current?.close()
    transportRef.current = null
    if (!runId) return

    try {
      const transport = createBroadcastChannelLiveSessionTransport(runId)
      transportRef.current = transport
      const unsubscribe = transport.subscribe((message) => {
        const terminal =
          message.event.type === 'scenario_completed' &&
          terminalScenarioIds.has(message.event.scenarioId)
        dispatch(receiveLiveSessionEvent({ envelope: message, terminal }))
      })
      return () => {
        unsubscribe()
        transport.close()
        if (transportRef.current === transport) transportRef.current = null
      }
    } catch (error) {
      dispatch(failLiveSession(error instanceof Error ? error.message : 'Live Session недоступен'))
    }
  }, [dispatch, runId, terminalScenarioIds])

  const iframeUrl = useMemo(() => {
    if (!runId || !('startUrl' in state) || !state.startUrl) return undefined
    const url = new URL(state.startUrl, window.location.origin)
    url.searchParams.set('liveSession', runId)
    return `${url.pathname}${url.search}`
  }, [runId, state])

  return {
    state,
    iframeUrl,
    start: (startUrl: string) => {
      const nextRunId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      dispatch(startLiveSession({ runId: nextRunId, startUrl }))
    },
    restart: () => {
      if ('startUrl' in state && state.startUrl) {
        const nextRunId = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        dispatch(startLiveSession({ runId: nextRunId, startUrl: state.startUrl }))
      }
    },
    stop: () => dispatch(stopLiveSession()),
    ready: () => dispatch(markLiveSessionReady()),
    setViewport: (viewport: LiveViewport) => dispatch(setLiveViewport(viewport)),
  }
}
