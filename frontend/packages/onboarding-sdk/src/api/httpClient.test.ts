import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { OnboardingEventPayload } from '../types/contracts'
import {
  createHttpOnboardingClient,
  OnboardingApiError,
} from './httpClient'

describe('HTTP onboarding client adapter', () => {
  beforeEach(() => sessionStorage.clear())

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
      flowOrder: 1,
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

  it('resolves global progress and adjacent pages from the backend flow config', async () => {
    const scenarios = new Map([
      ['/profile', createBackendScenario('profile', 1, '/new')],
      ['/new', createBackendScenario('new', 1, '/transport')],
      ['/transport', createBackendScenario('transport', 1, '/auto')],
      ['/auto', createBackendScenario('auto', 3)],
    ])
    const fetchClient = jest.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input), 'https://onboarding.test')

      if (url.pathname.endsWith('/widget/config')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            flowId: 'flow-id',
            flowKey: 'first-listing',
            scenarios: [
              { scenarioId: 'profile', url: '/profile', orderNum: 1, stepCount: 1 },
              { scenarioId: 'new', url: '/new', orderNum: 2, stepCount: 1 },
              { scenarioId: 'transport', url: '/transport', orderNum: 3, stepCount: 1 },
              { scenarioId: 'auto', url: '/auto', orderNum: 4, stepCount: 3 },
            ],
          }),
        } as Response
      }

      const scenario = scenarios.get(url.searchParams.get('pageUrl') ?? '')
      return {
        ok: Boolean(scenario),
        status: scenario ? 200 : 404,
        json: async () =>
          scenario
            ? {
                scenario,
                flow: { flowId: 'flow-id', flowKey: 'first-listing' },
              }
            : undefined,
      } as Response
    })
    const client = createHttpOnboardingClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    const profile = await client.getConfig({
      projectKey: 'avito-demo',
      pageUrl: '/profile',
      sessionId: 'linear-session',
    })
    const auto = await client.getConfig({
      projectKey: 'avito-demo',
      pageUrl: '/auto',
      sessionId: 'linear-session',
    })

    expect(profile).toMatchObject({
      flowId: 'flow-id',
      flowKey: 'first-listing',
      flowOrder: 1,
      stepOffset: 0,
      totalSteps: 6,
      nextPage: { scenarioId: 'new', pageUrl: '/new' },
    })
    expect(auto).toMatchObject({
      flowOrder: 4,
      stepOffset: 3,
      totalSteps: 6,
      previousPage: { scenarioId: 'transport', pageUrl: '/transport' },
    })
    expect(fetchClient).toHaveBeenCalledTimes(4)
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

function createBackendScenario(
  id: string,
  stepCount: number,
  nextUrl?: string,
) {
  return {
    id,
    name: id,
    steps: Array.from({ length: stepCount }, (_, index) => ({
      id: `${id}-step-${index + 1}`,
      orderNum: index + 1,
      selector: `#${id}-${index + 1}`,
      title: `Step ${index + 1}`,
      body: 'Body',
      nextUrl: index === stepCount - 1 ? nextUrl : undefined,
    })),
  }
}
