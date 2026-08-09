import type {
  OnboardingEventPayload,
  ScenarioStatus,
} from '@interactive-onboarding/shared'

export type AnalyticsSource = 'real' | 'mock'

export type AnalyticsScenario = {
  id: string
  projectId: string
  name: string
  url: string
  status: ScenarioStatus
}

export type AnalyticsStep = {
  id: string
  order: number
  title: string
  pageUrl: string
  views: number
  completed: number
  conversion: number
}

export type ScenarioAnalyticsData = {
  totalViews: number
  completed: number
  dismissed: number
  completionRate: number
  steps: AnalyticsStep[]
  targetMisses?: number
  events?: OnboardingEventPayload[]
}

export type AnalyticsRepository = {
  source: AnalyticsSource
  listScenarios: () => Promise<AnalyticsScenario[]>
  getAnalytics: (
    scenario: AnalyticsScenario,
  ) => Promise<ScenarioAnalyticsData>
  downloadReport: (scenario: AnalyticsScenario) => Promise<void>
  resetAnalytics?: () => Promise<void>
}
