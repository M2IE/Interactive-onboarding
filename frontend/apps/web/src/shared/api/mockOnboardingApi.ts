import type {
  AnalyticsSummary,
  OnboardingApiClient,
  OnboardingEventPayload,
  OnboardingScenario,
  WidgetConfig,
  WidgetConfigRequest,
} from '@interactive-onboarding/shared'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import {
  buildAnalyticsSummaryFromEvents,
  buildStepFunnelFromEvents,
} from '@/features/scenario-analytics/model/analytics'
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

export function buildStepFunnel(scenario: OnboardingScenario) {
  return buildStepFunnelFromEvents(scenario, readEvents())
}

export function buildAnalyticsSummary(): AnalyticsSummary {
  return buildAnalyticsSummaryFromEvents(readEvents())
}

export function downloadAnalyticsPdf(scenario: OnboardingScenario) {
  const summary = buildAnalyticsSummary()
  const funnel = buildStepFunnel(scenario)
  const lines = [
    'Interactive Onboarding Analytics',
    `Scenario: ${scenario.name}`,
    `Started: ${summary.started}`,
    `Completed: ${summary.completed}`,
    `Dismissed: ${summary.dismissed}`,
    `Completion rate: ${summary.completionRate}%`,
    '',
    'Funnel:',
    ...funnel.map(
      ({ step, views, completed, conversion }) =>
        `${step.order}. ${step.id}: views ${views}, completed ${completed}, conversion ${conversion}%`,
    ),
  ]

  const blob = createSimplePdf(lines)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'onboarding-analytics-demo.pdf'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function normalizePath(pageUrl: string) {
  if (pageUrl.startsWith('http')) {
    return new URL(pageUrl).pathname
  }

  return pageUrl.split('?')[0].replace(/\/$/, '') || '/'
}

function createSimplePdf(lines: string[]) {
  const textCommands = lines
    .map((line, index) => `72 ${760 - index * 18} Td (${escapePdf(line)}) Tj`)
    .join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${textCommands.length + 31} >> stream\nBT /F1 12 Tf\n${textCommands}\nET\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ]
  let offset = '%PDF-1.4\n'.length
  const xref = objects.map((object) => {
    const current = offset
    offset += object.length + 1
    return current
  })
  const body = objects.join('\n')
  const table = xref
    .map((item) => `${String(item).padStart(10, '0')} 00000 n `)
    .join('\n')
  const pdf = `%PDF-1.4\n${body}\nxref\n0 ${objects.length + 1}\n0000000000 65535 f \n${table}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

function escapePdf(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}
