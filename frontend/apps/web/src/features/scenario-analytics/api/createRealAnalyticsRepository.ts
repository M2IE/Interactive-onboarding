import {
  createAdminApiClient,
  type AdminAnalytics,
} from '@interactive-onboarding/api-client'
import { triggerBrowserDownload } from '@/shared/lib/download'
import type {
  AnalyticsRepository,
  AnalyticsScenario,
  ScenarioAnalyticsData,
} from '../model/types'

type RealAnalyticsRepositoryOptions = {
  apiBaseUrl: string
  projectKey: string
  projectId?: string
}

export function createRealAnalyticsRepository({
  apiBaseUrl,
  projectKey,
  projectId,
}: RealAnalyticsRepositoryOptions): AnalyticsRepository {
  const apiClient = createAdminApiClient({ apiBaseUrl })
  let resolvedProjectId = projectId

  async function getProjectId() {
    if (!resolvedProjectId) {
      const project = await apiClient.getProjectByKey(projectKey)
      resolvedProjectId = project.id
    }

    return resolvedProjectId
  }

  return {
    source: 'real',

    async listScenarios() {
      const scenarios = await apiClient.listScenarios(await getProjectId())

      return scenarios
        .filter((scenario) => scenario.status === 'published')
        .map((scenario) => ({
          id: scenario.id,
          projectId: scenario.projectId,
          name: scenario.name,
          url: scenario.url,
          status: scenario.status,
        }))
    },

    async getAnalytics(scenario) {
      const analytics = await apiClient.getAnalytics(scenario.id)
      return mapAdminAnalytics(scenario, analytics)
    },

    async downloadReport(scenario) {
      const reportLocation = await apiClient.generateReport(scenario.id)
      const downloadUrl = apiClient.resolveReportDownloadUrl(
        scenario.id,
        reportLocation,
      )

      triggerBrowserDownload(downloadUrl, 'onboarding-analytics.pdf')
    },
  }
}

export function mapAdminAnalytics(
  scenario: AnalyticsScenario,
  analytics: AdminAnalytics,
): ScenarioAnalyticsData {
  return {
    totalViews: analytics.totalViews,
    completed: analytics.completed,
    dismissed: analytics.dismissed,
    completionRate:
      analytics.totalViews === 0
        ? 0
        : Math.round((analytics.completed / analytics.totalViews) * 100),
    steps: analytics.steps
      .toSorted((left, right) => left.orderNum - right.orderNum)
      .map((step) => ({
        id: step.stepId,
        order: step.orderNum,
        title: step.title,
        pageUrl: scenario.url,
        views: step.views,
        completed: step.completed,
        conversion:
          step.views === 0
            ? 0
            : Math.round((step.completed / step.views) * 100),
      })),
  }
}
