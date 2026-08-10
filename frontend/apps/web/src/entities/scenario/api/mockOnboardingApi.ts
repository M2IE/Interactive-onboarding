import type {
  OnboardingApiClient,
  OnboardingEventPayload,
  OnboardingScenario,
  WidgetConfig,
  WidgetConfigRequest,
} from '@m2ie/onboarding-sdk'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { readJson, writeJson } from '@/shared/lib/storage'

const SCENARIOS_KEY = 'interactive-onboarding:scenarios:v2'
const EVENTS_KEY = 'interactive-onboarding:events:v2'

export function readScenarios(): OnboardingScenario[] {
  const scenarios = readJson<OnboardingScenario[] | null>(SCENARIOS_KEY, null)

  if (!scenarios) {
    writeScenarios(defaultScenarios)
    return defaultScenarios
  }

  return scenarios
}

export function writeScenarios(scenarios: OnboardingScenario[]) {
  writeJson(SCENARIOS_KEY, scenarios)
}

export function resetScenarios() {
  writeScenarios(defaultScenarios)
}

export function readEvents(): OnboardingEventPayload[] {
  return readJson<OnboardingEventPayload[]>(EVENTS_KEY, [])
}

export function clearEvents() {
  writeJson(EVENTS_KEY, [])
}

export const mockOnboardingClient: OnboardingApiClient = {
  async getConfig(request: WidgetConfigRequest) {
    return getPublishedConfig(request)
  },
  async trackEvent(event: OnboardingEventPayload) {
    const events = readEvents()

    if (events.some((item) => item.eventKey === event.eventKey)) {
      return
    }

    writeJson(EVENTS_KEY, [...events, event])
  },
}

export function getPublishedConfig({
  projectKey,
  pageUrl,
}: WidgetConfigRequest): WidgetConfig | null {
  const pathname = normalizePath(pageUrl)
  const scenarios = readScenarios()
  const scenario = scenarios.find(
    (item) =>
      item.projectKey === projectKey &&
      item.status === 'published' &&
      normalizePath(item.url) === pathname,
  )

  if (!scenario) {
    return null
  }

  const steps = scenario.steps.toSorted((left, right) => left.order - right.order)

  if (steps.length === 0) {
    return null
  }

  const flowScenarios = scenarios
    .filter(
      (item) =>
        item.projectKey === projectKey &&
        item.flowKey === scenario.flowKey &&
        item.status === 'published',
    )
    .toSorted((left, right) => left.flowOrder - right.flowOrder)
  const stepOffset = flowScenarios
    .filter((item) => item.flowOrder < scenario.flowOrder)
    .reduce((total, item) => total + item.steps.length, 0)

  return {
    projectKey: scenario.projectKey,
    flowKey: scenario.flowKey,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    version: scenario.version,
    versionId: scenario.versionId,
    pageUrl: pathname,
    stepOffset,
    totalSteps: flowScenarios.reduce(
      (total, item) => total + item.steps.length,
      0,
    ),
    steps,
  }
}

function normalizePath(pageUrl: string) {
  if (pageUrl.startsWith('http')) {
    return new URL(pageUrl).pathname
  }

  return pageUrl.split('?')[0].replace(/\/$/, '') || '/'
}
