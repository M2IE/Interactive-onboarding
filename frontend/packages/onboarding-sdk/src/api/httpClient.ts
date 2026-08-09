import type {
  OnboardingApiClient,
  OnboardingEventPayload,
  WidgetConfig,
  WidgetConfigRequest,
} from '@interactive-onboarding/shared'
import {
  createWidgetApiClient,
  type FetchClient,
  type WidgetScenarioResponse,
} from '@interactive-onboarding/api-client'

type HttpClientOptions = {
  apiBaseUrl: string
  fetchClient?: FetchClient
}

export function createHttpOnboardingClient({
  apiBaseUrl,
  fetchClient,
}: HttpClientOptions): OnboardingApiClient {
  const widgetApi = createWidgetApiClient({ apiBaseUrl, fetchClient })

  return {
    async getConfig(request: WidgetConfigRequest): Promise<WidgetConfig | null> {
      const response = await widgetApi.getScenario({
        projectKey: request.projectKey,
        pageUrl: request.pageUrl,
      })
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

      await widgetApi.postEvent({
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
      })
    },
  }
}

type BackendScenario = NonNullable<WidgetScenarioResponse['scenario']>

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
