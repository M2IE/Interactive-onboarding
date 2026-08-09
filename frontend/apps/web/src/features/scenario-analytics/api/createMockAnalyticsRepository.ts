import type { OnboardingScenario } from '@m2ie/onboarding-sdk'
import {
  clearEvents,
  readEvents,
  readScenarios,
} from '@/entities/scenario/api/mockOnboardingApi'
import { triggerBrowserDownload } from '@/shared/lib/download'
import {
  buildAnalyticsSummaryFromEvents,
  buildStepFunnelFromEvents,
} from '../model/analytics'
import type { AnalyticsRepository } from '../model/types'

export function createMockAnalyticsRepository(): AnalyticsRepository {
  return {
    source: 'mock',

    async listScenarios() {
      return readScenarios()
        .filter((scenario) => scenario.status === 'published')
        .map(({ id, projectId, name, url, status }) => ({
          id,
          projectId,
          name,
          url,
          status,
        }))
    },

    async getAnalytics(scenario) {
      const storedScenario = findScenario(scenario.id)
      const events = readEvents()
      const summary = buildAnalyticsSummaryFromEvents(events)
      const funnel = buildStepFunnelFromEvents(storedScenario, events)

      return {
        totalViews: summary.started,
        completed: summary.completed,
        dismissed: summary.dismissed,
        completionRate: summary.completionRate,
        targetMisses: summary.targetMisses,
        events,
        steps: funnel.map(({ step, pageUrl, ...metrics }) => ({
          id: step.id,
          order: step.order,
          title: step.title,
          pageUrl,
          ...metrics,
        })),
      }
    },

    async downloadReport(scenario) {
      const storedScenario = findScenario(scenario.id)
      const blob = createMockPdf(storedScenario, readEvents())
      const url = URL.createObjectURL(blob)

      triggerBrowserDownload(url, 'onboarding-analytics-demo.pdf')
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    },

    async resetAnalytics() {
      clearEvents()
    },
  }
}

function findScenario(scenarioId: string) {
  const scenario = readScenarios().find((item) => item.id === scenarioId)

  if (!scenario) {
    throw new Error('Сценарий аналитики не найден')
  }

  return scenario
}

function createMockPdf(
  scenario: OnboardingScenario,
  events: ReturnType<typeof readEvents>,
) {
  const summary = buildAnalyticsSummaryFromEvents(events)
  const funnel = buildStepFunnelFromEvents(scenario, events)
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
