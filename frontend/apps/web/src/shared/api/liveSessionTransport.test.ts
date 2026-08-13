import { isLiveSessionEnvelope } from './liveSessionTransport'

describe('live session protocol', () => {
  const envelope = {
    version: 1,
    runId: 'run-1',
    sequence: 1,
    emittedAt: '2026-08-13T10:00:00.000Z',
    event: {
      projectKey: 'demo',
      scenarioId: 'scenario',
      versionId: 'version',
      sessionId: 'session',
      type: 'step_viewed',
      eventKey: 'event',
      pageUrl: '/demo',
      createdAt: '2026-08-13T10:00:00.000Z',
    },
  } as const

  it('accepts the supported protocol and expected run', () => {
    expect(isLiveSessionEnvelope(envelope, 'run-1')).toBe(true)
  })

  it('rejects foreign runs and malformed messages', () => {
    expect(isLiveSessionEnvelope(envelope, 'run-2')).toBe(false)
    expect(isLiveSessionEnvelope({ ...envelope, version: 2 }, 'run-1')).toBe(false)
    expect(isLiveSessionEnvelope({ type: 'random' }, 'run-1')).toBe(false)
  })
})
