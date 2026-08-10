import { describe, expect, it } from '@jest/globals'
import type {
  OnboardingEventPayload,
  OnboardingScenario,
} from '@m2ie/onboarding-sdk'
import { defaultScenario } from '@/entities/scenario/defaultScenario'
import {
  buildAnalyticsSummaryFromEvents,
  buildStepFunnelFromEvents,
} from './analytics'

describe('analytics model', () => {
  it('counts scenario summary and per-step funnel from tracked events', () => {
    const scenario = cloneScenario()
    const firstStep = scenario.steps[0]
    const events = [
      createEvent('scenario_started', 'session-1'),
      createEvent('step_viewed', 'session-1', firstStep.id),
      createEvent('step_completed', 'session-1', firstStep.id),
      createEvent('scenario_completed', 'session-1'),
      createEvent('scenario_started', 'session-2'),
      createEvent('scenario_dismissed', 'session-2', firstStep.id),
      createEvent('target_not_found', 'session-2', firstStep.id),
    ]

    const summary = buildAnalyticsSummaryFromEvents(events)
    const funnel = buildStepFunnelFromEvents(scenario, events)

    expect(summary.started).toBe(2)
    expect(summary.completed).toBe(1)
    expect(summary.dismissed).toBe(1)
    expect(summary.targetMisses).toBe(1)
    expect(summary.completionRate).toBe(50)
    expect(funnel[0]).toMatchObject({
      views: 1,
      completed: 1,
      conversion: 100,
    })
  })
})

function cloneScenario(): OnboardingScenario {
  return JSON.parse(JSON.stringify(defaultScenario)) as OnboardingScenario
}

function createEvent(
  type: OnboardingEventPayload['type'],
  sessionId: string,
  stepId?: string,
): OnboardingEventPayload {
  return {
    projectKey: defaultScenario.projectKey,
    scenarioId: defaultScenario.id,
    versionId: defaultScenario.versionId,
    stepId,
    sessionId,
    type,
    eventKey: `${sessionId}:${stepId ?? 'scenario'}:${type}`,
    pageUrl: '/demo/profile',
    createdAt: '2026-08-04T10:00:00.000Z',
  }
}
