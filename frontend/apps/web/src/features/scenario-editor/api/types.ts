import type { OnboardingScenario } from '@interactive-onboarding/shared'

export type ScenarioRepository = {
  source: 'mock' | 'real'
  listScenarios: () => Promise<OnboardingScenario[]>
  createScenario: () => Promise<OnboardingScenario>
  addStep: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  saveScenario: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  publishScenario: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  unpublishScenario: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  resetScenarios: () => Promise<OnboardingScenario[]>
}

export type ScenarioRepositoryServices = {
  scenarioRepository: ScenarioRepository
}
