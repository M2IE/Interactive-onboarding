import { describe, expect, it, jest } from '@jest/globals'
import { ApiError } from './http'
import { createWidgetApiClient } from './widgetClient'

describe('Widget API client', () => {
  it('requests the current page scenario and preserves query values', async () => {
    const fetchClient = createFetch({
      status: 200,
      body: {
        scenario: {
          id: 'scenario-1',
          name: 'Profile onboarding',
          steps: [],
        },
      },
    })
    const client = createWidgetApiClient({
      apiBaseUrl: '/api/v1/',
      fetchClient,
    })

    await client.getScenario({
      projectKey: 'avito demo',
      pageUrl: '/demo/profile?source=test',
    })

    expect(fetchClient).toHaveBeenCalledWith(
      '/api/v1/widget/scenario?projectKey=avito+demo&pageUrl=%2Fdemo%2Fprofile%3Fsource%3Dtest',
      undefined,
    )
  })

  it.each([204, 404])('maps status %s to an empty scenario', async (status) => {
    const client = createWidgetApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient: createFetch({ status }),
    })

    await expect(
      client.getScenario({ projectKey: 'avito-demo', pageUrl: '/missing' }),
    ).resolves.toBeNull()
  })

  it('throws a typed error for an unexpected API response', async () => {
    const client = createWidgetApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient: createFetch({
        status: 500,
        body: { error: { code: 'INTERNAL_ERROR', message: 'Database failed' } },
      }),
    })

    await expect(
      client.getScenario({ projectKey: 'avito-demo', pageUrl: '/demo/profile' }),
    ).rejects.toEqual(
      expect.objectContaining<ApiError>({
        code: 'INTERNAL_ERROR',
        message: 'Database failed',
        status: 500,
      }),
    )
  })

  it('posts the backend snake_case event payload', async () => {
    const fetchClient = createFetch({ status: 204 })
    const client = createWidgetApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    await client.postEvent({
      session_id: 'session-1',
      step_id: 'step-1',
      type: 'step_completed',
      event_key: 'event-1',
    })

    expect(fetchClient).toHaveBeenCalledWith('/api/v1/widget/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'session-1',
        step_id: 'step-1',
        type: 'step_completed',
        event_key: 'event-1',
      }),
    })
  })
})

type FetchResponse = {
  status: number
  body?: unknown
}

function createFetch({ status, body }: FetchResponse) {
  return jest.fn<typeof fetch>().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)
}
