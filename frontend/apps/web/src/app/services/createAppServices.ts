import {
  createHttpOnboardingClient,
  type OnboardingApiClient,
} from '@m2ie/onboarding-sdk'
import {
  createMockAnalyticsRepository,
  createRealAnalyticsRepository,
  type AnalyticsRepository,
} from '@/features/scenario-analytics'
import { mockOnboardingClient } from '@/entities/scenario/api/mockOnboardingApi'
import {
  createMockScenarioRepository,
} from '@/features/scenario-editor/api/createMockScenarioRepository'
import { createRealScenarioRepository } from '@/features/scenario-editor/api/createRealScenarioRepository'
import type { ScenarioRepository } from '@/features/scenario-editor/api/types'
import type { ApiMode, AppConfig } from '@/shared/config/appConfig'
import { applyAnalyticsPolicy } from '@/shared/api/applyAnalyticsPolicy'
import type { JourneyRepository } from '@/features/journey-map'
import { createJourneyRepository } from './createJourneyRepository'

export type AppServices = {
  analyticsRepository: AnalyticsRepository
  analyticsEnabled: boolean
  apiMode: ApiMode
  onboardingClient: OnboardingApiClient
  projectKey: string
  scenarioRepository: ScenarioRepository
  journeyRepository: JourneyRepository
}

export function createAppServices(config: AppConfig): AppServices {
  if (config.apiMode === 'mock') {
    const analyticsRepository = createMockAnalyticsRepository()
    const scenarioRepository = createMockScenarioRepository()
    return {
      analyticsRepository,
      analyticsEnabled: config.analyticsEnabled,
      apiMode: config.apiMode,
      onboardingClient: mockOnboardingClient,
      projectKey: config.projectKey,
      scenarioRepository,
      journeyRepository: createJourneyRepository({ analyticsRepository, scenarioRepository }),
    }
  }

  const analyticsRepository = createRealAnalyticsRepository({
      apiBaseUrl: config.apiBaseUrl,
      projectId: config.projectId,
      projectKey: config.projectKey,
    })
  const scenarioRepository = createRealScenarioRepository({
      apiBaseUrl: config.apiBaseUrl,
      projectId: config.projectId,
      projectKey: config.projectKey,
    })
  return {
    analyticsRepository,
    analyticsEnabled: config.analyticsEnabled,
    apiMode: config.apiMode,
    onboardingClient: applyAnalyticsPolicy(
      createHttpOnboardingClient({ apiBaseUrl: config.apiBaseUrl }),
      config.analyticsEnabled,
    ),
    projectKey: config.projectKey,
    scenarioRepository,
    journeyRepository: createJourneyRepository({ analyticsRepository, scenarioRepository }),
  }
}
