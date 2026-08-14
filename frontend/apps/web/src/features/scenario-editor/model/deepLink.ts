import type { OnboardingScenario } from '@m2ie/onboarding-sdk'

export type ScenarioDeepLinkResolution =
  | { status: 'none' }
  | { status: 'found'; scenarioId: string }
  | { status: 'missing'; scenarioId: string }

export function resolveScenarioDeepLink(
  scenarios: OnboardingScenario[],
  requestedScenarioId?: string | null,
): ScenarioDeepLinkResolution {
  if (!requestedScenarioId) {
    return { status: 'none' }
  }

  return scenarios.some((scenario) => scenario.id === requestedScenarioId)
    ? { status: 'found', scenarioId: requestedScenarioId }
    : { status: 'missing', scenarioId: requestedScenarioId }
}
