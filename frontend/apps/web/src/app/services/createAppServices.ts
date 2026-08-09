import { createHttpOnboardingClient } from '@interactive-onboarding/onboarding-sdk'
import type { OnboardingApiClient } from '@interactive-onboarding/shared'
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

export type AppServices = {
  analyticsRepository: AnalyticsRepository
  apiMode: ApiMode
  onboardingClient: OnboardingApiClient
  projectKey: string
  scenarioRepository: ScenarioRepository
}

export function createAppServices(config: AppConfig): AppServices {
  if (config.apiMode === 'mock') {
    return {
      analyticsRepository: createMockAnalyticsRepository(),
      apiMode: config.apiMode,
      onboardingClient: mockOnboardingClient,
      projectKey: config.projectKey,
      scenarioRepository: createMockScenarioRepository(),
    }
  }

  return {
    analyticsRepository: createRealAnalyticsRepository({
      apiBaseUrl: config.apiBaseUrl,
      projectId: config.projectId,
      projectKey: config.projectKey,
    }),
    apiMode: config.apiMode,
    onboardingClient: createHttpOnboardingClient({
      apiBaseUrl: config.apiBaseUrl,
    }),
    projectKey: config.projectKey,
    scenarioRepository: createRealScenarioRepository({
      apiBaseUrl: config.apiBaseUrl,
      projectId: config.projectId,
      projectKey: config.projectKey,
    }),
  }
}
