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
  scenario: BackendScenario
  flow?: {
    flowId: string
    flowKey: string
  }
}

type BackendFlowConfigItem = {
  scenarioId: string
  url: string
  orderNum: number
  stepCount: number
}

type BackendFlowConfigResponse = {
  flowId: string
  flowKey: string
  scenarios: BackendFlowConfigItem[]
}

export function createHttpOnboardingClient({
  apiBaseUrl,
  fetchClient = fetch,
}: HttpOnboardingClientOptions): OnboardingApiClient {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '')
  const loadScenario = async (
    request: WidgetConfigRequest,
  ): Promise<WidgetScenarioResponse | null> => {
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
    if (!response?.scenario || response.scenario.steps.length === 0) {
      return null
    }

    return response
  }

  return {
    async getConfig(request: WidgetConfigRequest): Promise<WidgetConfig | null> {
      const response = await loadScenario(request)

      if (!response) {
        return null
      }

      if (!response.flow) {
        return mapWidgetConfig(request, response.scenario)
      }

      const params = new URLSearchParams({
        projectKey: request.projectKey,
        flowKey: response.flow.flowKey,
      })
      const flowConfig = await requestJson<BackendFlowConfigResponse>(
        fetchClient,
        `${normalizedBaseUrl}/widget/config?${params}`,
      )

      return mapFlowWidgetConfig(request, response, flowConfig)
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
  progress?: {
    flowId: string
    flowKey: string
    current: BackendFlowConfigItem
    previous?: BackendFlowConfigItem
    next?: BackendFlowConfigItem
    stepOffset: number
    totalSteps: number
  },
): WidgetConfig {
  return {
    projectKey: request.projectKey,
    flowId: progress?.flowId,
    flowKey: progress?.flowKey ?? scenario.id,
    flowOrder: progress?.current.orderNum ?? 1,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    version: 1,
    versionId: scenario.id,
    pageUrl: request.pageUrl,
    stepOffset: progress?.stepOffset ?? 0,
    totalSteps: progress?.totalSteps ?? scenario.steps.length,
    previousPage: progress?.previous
      ? mapFlowPage(progress.previous)
      : undefined,
    nextPage: progress?.next ? mapFlowPage(progress.next) : undefined,
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

function mapFlowWidgetConfig(
  request: WidgetConfigRequest,
  response: WidgetScenarioResponse,
  flowConfig: BackendFlowConfigResponse | null,
) {
  if (!flowConfig || flowConfig.flowId !== response.flow?.flowId) {
    return mapWidgetConfig(request, response.scenario)
  }

  const scenarios = flowConfig.scenarios.toSorted(
    (left, right) => left.orderNum - right.orderNum,
  )
  const currentIndex = scenarios.findIndex(
    (item) => item.scenarioId === response.scenario.id,
  )
  const current = scenarios[currentIndex]

  if (!current) {
    return mapWidgetConfig(request, response.scenario)
  }

  return mapWidgetConfig(request, response.scenario, {
    flowId: flowConfig.flowId,
    flowKey: flowConfig.flowKey,
    current,
    previous: scenarios[currentIndex - 1],
    next: scenarios[currentIndex + 1],
    stepOffset: scenarios
      .slice(0, currentIndex)
      .reduce((total, item) => total + item.stepCount, 0),
    totalSteps: scenarios.reduce(
      (total, item) => total + item.stepCount,
      0,
    ),
  })
}

function mapFlowPage(item: BackendFlowConfigItem) {
  return {
    scenarioId: item.scenarioId,
    pageUrl: item.url,
    flowOrder: item.orderNum,
    stepCount: item.stepCount,
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
