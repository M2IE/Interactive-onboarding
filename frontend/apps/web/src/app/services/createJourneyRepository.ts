import type { JourneyRepository } from '@/features/journey-map'
import type { AnalyticsRepository } from '@/features/scenario-analytics'
import type { ScenarioRepository } from '@/features/scenario-editor/api/types'

type JourneyRepositoryDependencies = {
  analyticsRepository: AnalyticsRepository
  scenarioRepository: ScenarioRepository
}

export function createJourneyRepository({
  analyticsRepository,
  scenarioRepository,
}: JourneyRepositoryDependencies): JourneyRepository {
  return {
    source: scenarioRepository.source,

    async listPublishedScenarios() {
      const scenarios = await scenarioRepository.listScenarios()
      return scenarios.filter((scenario) => scenario.status === 'published')
    },

    async getMetrics(scenario) {
      const analytics = await analyticsRepository.getAnalytics({
        id: scenario.id,
        projectId: scenario.projectId,
        name: scenario.name,
        url: scenario.url,
        status: scenario.status,
      })

      return {
        views: analytics.totalViews,
        completed: analytics.completed,
        conversion: analytics.completionRate,
      }
    },
  }
}
