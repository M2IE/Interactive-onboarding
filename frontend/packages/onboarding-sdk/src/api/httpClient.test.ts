import { describe, expect, it, jest } from '@jest/globals'
import type { OnboardingEventPayload } from '../types/contracts'
import {
  createHttpOnboardingClient,
  OnboardingApiError,
} from './httpClient'

describe('HTTP onboarding client adapter', () => {
  it('maps the MVP response to a page-local widget config', async () => {
    const fetchClient = createFetch({
      scenario: {
        id: 'scenario-1',
        name: 'Profile onboarding',
        steps: [
          {
            id: 'step-2',
            orderNum: 2,
            selector: '#second',
            title: 'Second',
            body: 'Second body',
          },
          {
            id: 'step-1',
            orderNum: 1,
            selector: '#first',
            title: 'First',
            body: 'First body',
            nextUrl: '/demo/new',
          },
        ],
      },
    })
    const client = createHttpOnboardingClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    const config = await client.getConfig({
      projectKey: 'avito-demo',
      pageUrl: '/demo/profile',
      sessionId: 'session-1',
      userId: 'user-1',
    })

    expect(config).toMatchObject({
      flowKey: 'scenario-1',
      scenarioId: 'scenario-1',
      version: 1,
      versionId: 'scenario-1',
      stepOffset: 0,
      totalSteps: 2,
      steps: [
        {
          id: 'step-1',
          order: 1,
          placement: 'right',
          completion: 'next_button',
          nextUrl: '/demo/new',
        },
        { id: 'step-2', order: 2 },
      ],
    })
    expect(fetchClient).toHaveBeenCalledWith(
      '/api/v1/widget/scenario?projectKey=avito-demo&pageUrl=%2Fdemo%2Fprofile',
      undefined,
    )
  })

  it.each([
    'scenario_started',
    'scenario_completed',
    'target_not_found',
  ] as const)('does not send unsupported %s events', async (type) => {
    const fetchClient = createFetch(undefined, 204)
    const client = createHttpOnboardingClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    await client.trackEvent(createEvent(type))

    expect(fetchClient).not.toHaveBeenCalled()
  })

  it.each([204, 404])('maps a %s response to an empty config', async (status) => {
    const client = createHttpOnboardingClient({
      apiBaseUrl: '/api/v1/',
      fetchClient: createFetch(undefined, status),
    })

    await expect(
      client.getConfig({
        projectKey: 'avito-demo',
        pageUrl: '/demo/profile',
        sessionId: 'session-1',
      }),
    ).resolves.toBeNull()
  })

  it('exposes a typed API error without falling back to mock data', async () => {
    const client = createHttpOnboardingClient({
      apiBaseUrl: '/api/v1',
      fetchClient: createFetch(
        { error: { code: 'INTERNAL_ERROR', message: 'Backend unavailable' } },
        500,
      ),
    })

    const request = client.getConfig({
      projectKey: 'avito-demo',
      pageUrl: '/demo/profile',
      sessionId: 'session-1',
    })

    await expect(request).rejects.toEqual(
      expect.objectContaining<Partial<OnboardingApiError>>({
        name: 'OnboardingApiError',
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Backend unavailable',
      }),
    )
  })

  it('maps a dismiss event to the backend contract', async () => {
    const fetchClient = createFetch(undefined, 204)
    const client = createHttpOnboardingClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    await client.trackEvent(createEvent('scenario_dismissed'))

    expect(fetchClient).toHaveBeenCalledWith('/api/v1/widget/event', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'session-1',
        type: 'scenario_dismissed',
        scenario_id: 'scenario-1',
        event_key: 'event-1',
      }),
    })
  })
})

function createEvent(
  type: OnboardingEventPayload['type'],
): OnboardingEventPayload {
  return {
    projectKey: 'avito-demo',
    scenarioId: 'scenario-1',
    versionId: 'scenario-1',
    stepId: 'step-1',
    sessionId: 'session-1',
    type,
    eventKey: 'event-1',
    pageUrl: '/demo/profile',
    createdAt: '2026-08-08T10:00:00.000Z',
  }
}

function createFetch(body: unknown, status = 200) {
  return jest.fn<typeof fetch>().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)
}
