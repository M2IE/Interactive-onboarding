import type { OnboardingScenario } from '@m2ie/onboarding-sdk'

export type ScenarioRepository = {
  source: 'mock' | 'real'
  listScenarios: () => Promise<OnboardingScenario[]>
  createScenario: () => Promise<OnboardingScenario>
  addStep: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  deleteStep: (
    scenario: OnboardingScenario,
    stepId: string,
  ) => Promise<OnboardingScenario>
  saveScenario: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  publishScenario: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  unpublishScenario: (scenario: OnboardingScenario) => Promise<OnboardingScenario>
  resetScenarios: () => Promise<OnboardingScenario[]>
}

export type ScenarioRepositoryServices = {
  scenarioRepository: ScenarioRepository
}
