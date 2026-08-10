import type {
  OnboardingApiClient,
  OnboardingEventPayload,
  WidgetConfig,
  WidgetConfigRequest,
} from '../types/contracts'

export type FetchClient = typeof fetch

export type HttpOnboardingClientOptions = {
  apiBaseUrl: string
  fetchClient?: FetchClient
}

type BackendScenario = {
  id: string
  name: string
  steps: BackendStep[]
}

type BackendStep = {
  id: string
  orderNum: number
  selector: string
  title: string
  body: string
  nextUrl?: string
}

type WidgetScenarioResponse = {
  scenario?: BackendScenario
}

export function createHttpOnboardingClient({
  apiBaseUrl,
  fetchClient = fetch,
}: HttpOnboardingClientOptions): OnboardingApiClient {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '')

  return {
    async getConfig(request: WidgetConfigRequest): Promise<WidgetConfig | null> {
      const params = new URLSearchParams({
        projectKey: request.projectKey,
        pageUrl: request.pageUrl,
      })
      const response = await requestJson<WidgetScenarioResponse>(
        fetchClient,
        `${normalizedBaseUrl}/widget/scenario?${params}`,
        undefined,
        [204, 404],
      )
      const scenario = response?.scenario

      if (!scenario || scenario.steps.length === 0) {
        return null
      }

      return mapWidgetConfig(request, scenario)
    },

    async trackEvent(event: OnboardingEventPayload): Promise<void> {
      if (!isBackendEvent(event)) {
        return
      }

      await requestVoid(fetchClient, `${normalizedBaseUrl}/widget/event`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: event.sessionId,
          type: event.type,
          step_id:
            event.type === 'step_viewed' || event.type === 'step_completed'
              ? event.stepId
              : undefined,
          scenario_id:
            event.type === 'scenario_dismissed'
              ? event.scenarioId
              : undefined,
          event_key: event.eventKey,
        }),
      })
    },
  }
}

function mapWidgetConfig(
  request: WidgetConfigRequest,
  scenario: BackendScenario,
): WidgetConfig {
  return {
    projectKey: request.projectKey,
    flowKey: scenario.id,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    version: 1,
    versionId: scenario.id,
    pageUrl: request.pageUrl,
    stepOffset: 0,
    totalSteps: scenario.steps.length,
    steps: scenario.steps
      .toSorted((left, right) => left.orderNum - right.orderNum)
      .map((step) => ({
        id: step.id,
        versionId: scenario.id,
        order: step.orderNum,
        selector: step.selector,
        title: step.title,
        body: step.body,
        placement: 'right',
        completion: 'next_button',
        nextUrl: step.nextUrl,
      })),
  }
}

function isBackendEvent(
  event: OnboardingEventPayload,
): event is OnboardingEventPayload & {
  type: 'step_viewed' | 'step_completed' | 'scenario_dismissed'
} {
  return (
    event.type === 'step_viewed' ||
    event.type === 'step_completed' ||
    event.type === 'scenario_dismissed'
  )
}

async function requestJson<T>(
  fetchClient: FetchClient,
  url: string,
  init?: RequestInit,
  emptyStatuses: number[] = [],
): Promise<T | null> {
  const response = await fetchClient(url, init)

  if (emptyStatuses.includes(response.status)) {
    return null
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return (await response.json()) as T
}

async function requestVoid(
  fetchClient: FetchClient,
  url: string,
  init?: RequestInit,
): Promise<void> {
  const response = await fetchClient(url, init)

  if (!response.ok) {
    throw await toApiError(response)
  }
}

async function toApiError(response: Response) {
  const fallbackMessage = `API request failed with status ${response.status}`

  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string }
    }

    return new OnboardingApiError(
      payload.error?.message ?? fallbackMessage,
      response.status,
      payload.error?.code,
    )
  } catch {
    return new OnboardingApiError(fallbackMessage, response.status)
  }
}

export class OnboardingApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'OnboardingApiError'
    this.status = status
    this.code = code
  }
}
