import type {
  AnalyticsSummary,
  OnboardingEventPayload,
  OnboardingEventType,
  OnboardingScenario,
} from '@interactive-onboarding/shared'

export type StepFunnelRow = {
  step: OnboardingScenario['steps'][number]
  pageUrl: string
  views: number
  completed: number
  conversion: number
}

export function buildStepFunnelFromEvents(
  scenario: OnboardingScenario,
  events: OnboardingEventPayload[],
): StepFunnelRow[] {
  return scenario.steps
    .toSorted((left, right) => left.order - right.order)
    .map((step) => {
      const views = countEvents(events, 'step_viewed', step.id)
      const completed = countEvents(events, 'step_completed', step.id)

      return {
        step,
        pageUrl: scenario.url,
        views,
        completed,
        conversion: views === 0 ? 0 : Math.round((completed / views) * 100),
      }
    })
}

export function buildAnalyticsSummaryFromEvents(
  events: OnboardingEventPayload[],
): AnalyticsSummary {
  const started = countEvents(events, 'scenario_started')
  const completed = countEvents(events, 'scenario_completed')
  const dismissed = countEvents(events, 'scenario_dismissed')
  const targetMisses = countEvents(events, 'target_not_found')

  return {
    started,
    completed,
    dismissed,
    targetMisses,
    completionRate: started === 0 ? 0 : Math.round((completed / started) * 100),
  }
}

function countEvents(
  events: OnboardingEventPayload[],
  type: OnboardingEventType,
  stepId?: string,
) {
  return events.filter(
    (event) => event.type === type && (!stepId || event.stepId === stepId),
  ).length
}
