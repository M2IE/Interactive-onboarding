import type { OnboardingScenario } from '@m2ie/onboarding-sdk'
import type { JourneyMetrics } from '../model/types'

export type JourneyRepository = {
  source: 'mock' | 'real'
  listPublishedScenarios: () => Promise<OnboardingScenario[]>
  getMetrics: (scenario: OnboardingScenario) => Promise<JourneyMetrics>
}

export type JourneyRepositoryServices = {
  journeyRepository: JourneyRepository
}
