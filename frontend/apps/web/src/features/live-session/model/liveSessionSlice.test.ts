import type { OnboardingLiveEnvelope } from '@/shared/api/liveSessionTransport'
import {
  liveSessionReducer,
  receiveLiveSessionEvent,
  startLiveSession,
} from './liveSessionSlice'

describe('liveSessionReducer', () => {
  it('tracks progress, deduplicates events and completes a run', () => {
    let state = liveSessionReducer(
      undefined,
      startLiveSession({ runId: 'run-1', startUrl: '/demo/profile' }),
    )
    const viewed = createEnvelope('step_viewed', 'viewed')
    state = liveSessionReducer(state, receiveLiveSessionEvent({ envelope: viewed, terminal: false }))
    state = liveSessionReducer(state, receiveLiveSessionEvent({ envelope: viewed, terminal: false }))

    expect(state.status).toBe('running')
    expect('events' in state ? state.events : []).toHaveLength(1)

    state = liveSessionReducer(
      state,
      receiveLiveSessionEvent({
        envelope: createEnvelope('scenario_completed', 'complete'),
        terminal: true,
      }),
    )
    expect(state.status).toBe('completed')
  })

  it('ignores an event from another run', () => {
    const state = liveSessionReducer(
      undefined,
      startLiveSession({ runId: 'run-1', startUrl: '/demo/profile' }),
    )
    const next = liveSessionReducer(
      state,
      receiveLiveSessionEvent({
        envelope: { ...createEnvelope('step_viewed', 'event'), runId: 'other' },
        terminal: false,
      }),
    )
    expect(next).toEqual(state)
  })
})

function createEnvelope(
  type: OnboardingLiveEnvelope['event']['type'],
  eventKey: string,
): OnboardingLiveEnvelope {
  return {
    version: 1,
    runId: 'run-1',
    sequence: 1,
    emittedAt: '2026-08-13T10:00:00.000Z',
    event: {
      projectKey: 'demo',
      scenarioId: 'scenario',
      versionId: 'version',
      stepId: 'step',
      sessionId: 'session',
      type,
      eventKey,
      pageUrl: '/demo/profile',
      createdAt: '2026-08-13T10:00:00.000Z',
    },
  }
}
