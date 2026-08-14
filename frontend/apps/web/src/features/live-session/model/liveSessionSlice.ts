import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { OnboardingLiveEnvelope } from '@/shared/api/liveSessionTransport'
import type { LiveSessionState, LiveViewport } from './types'

const initialState: LiveSessionState = { status: 'idle', viewport: 'desktop' }

const liveSessionSlice = createSlice({
  name: 'liveSession',
  initialState: initialState as LiveSessionState,
  reducers: {
    startLiveSession(
      state,
      action: PayloadAction<{ runId: string; startUrl: string }>,
    ): LiveSessionState {
      return {
        status: 'starting',
        viewport: state.viewport,
        runId: action.payload.runId,
        startUrl: action.payload.startUrl,
        events: [],
      }
    },
    markLiveSessionReady(state): LiveSessionState {
      if (state.status !== 'starting') return state
      return { ...state, status: 'running' }
    },
    receiveLiveSessionEvent(
      state,
      action: PayloadAction<{ envelope: OnboardingLiveEnvelope; terminal: boolean }>,
    ): LiveSessionState {
      const { envelope, terminal } = action.payload
      if (!hasActiveRun(state) || envelope.runId !== state.runId) return state
      const event = envelope.event
      if (state.events.some((item) => item.eventKey === event.eventKey)) return state
      const events = [...state.events, event].slice(-100)
      const shared = {
        viewport: state.viewport,
        runId: state.runId,
        startUrl: state.startUrl,
        events,
        currentScenarioId: event.scenarioId,
        currentStepId: event.stepId,
      }
      if (event.type === 'scenario_completed' && terminal) return { status: 'completed', ...shared }
      if (event.type === 'scenario_dismissed') return { status: 'dismissed', ...shared }
      return { status: 'running', ...shared }
    },
    stopLiveSession(state): LiveSessionState {
      return { status: 'idle', viewport: state.viewport }
    },
    failLiveSession(state, action: PayloadAction<string>): LiveSessionState {
      return {
        status: 'error',
        viewport: state.viewport,
        error: action.payload,
        runId: hasActiveRun(state) ? state.runId : undefined,
        startUrl: hasActiveRun(state) ? state.startUrl : undefined,
        events: 'events' in state ? state.events : [],
      }
    },
    setLiveViewport(state, action: PayloadAction<LiveViewport>): LiveSessionState {
      return { ...state, viewport: action.payload }
    },
  },
})

function hasActiveRun(
  state: LiveSessionState,
): state is Exclude<LiveSessionState, { status: 'idle' }> & {
  runId: string
  startUrl: string
} {
  return state.status !== 'idle' && Boolean(state.runId && state.startUrl)
}

export const {
  failLiveSession,
  markLiveSessionReady,
  receiveLiveSessionEvent,
  setLiveViewport,
  startLiveSession,
  stopLiveSession,
} = liveSessionSlice.actions
export const liveSessionReducer = liveSessionSlice.reducer
