import type { components } from './generated/admin'
import {
  normalizeApiBaseUrl,
  requestJson,
  requestVoid,
  type FetchClient,
} from './http'

export type AdminScenario = components['schemas']['Scenario']
export type AdminScenarioWithSteps = components['schemas']['ScenarioWithSteps']
export type AdminProject = components['schemas']['Project']
export type AdminStep = components['schemas']['Step']
export type AdminAnalytics = components['schemas']['AnalyticsResponse']
export type CreateAdminScenarioRequest =
  components['schemas']['CreateScenarioRequest']
export type UpdateAdminScenarioRequest =
  components['schemas']['UpdateScenarioRequest']
export type CreateAdminStepRequest = components['schemas']['CreateStepRequest']
export type UpdateAdminStepRequest = components['schemas']['UpdateStepRequest']

type ScenarioList = components['schemas']['ScenarioList']
type AnalyticsReportResponse =
  components['schemas']['AnalyticsReportResponse']

export type AdminApiClient = {
  getProjectByKey: (projectKey: string) => Promise<AdminProject>
  listScenarios: (projectId?: string) => Promise<AdminScenario[]>
  getScenario: (scenarioId: string) => Promise<AdminScenarioWithSteps>
  createScenario: (
    request: CreateAdminScenarioRequest,
  ) => Promise<AdminScenario>
  updateScenario: (
    scenarioId: string,
    request: UpdateAdminScenarioRequest,
  ) => Promise<AdminScenario>
  publishScenario: (scenarioId: string) => Promise<AdminScenario>
  unpublishScenario: (scenarioId: string) => Promise<void>
  createStep: (
    scenarioId: string,
    request: CreateAdminStepRequest,
  ) => Promise<AdminStep>
  updateStep: (
    scenarioId: string,
    stepId: string,
    request: UpdateAdminStepRequest,
  ) => Promise<AdminStep>
  deleteStep: (scenarioId: string, stepId: string) => Promise<void>
  getAnalytics: (scenarioId: string) => Promise<AdminAnalytics>
  generateReport: (scenarioId: string) => Promise<string>
  resolveReportDownloadUrl: (
    scenarioId: string,
    reportLocation: string,
  ) => string
}

type AdminApiClientOptions = {
  apiBaseUrl: string
  fetchClient?: FetchClient
}

export function createAdminApiClient({
  apiBaseUrl,
  fetchClient = fetch,
}: AdminApiClientOptions): AdminApiClient {
  const baseUrl = normalizeApiBaseUrl(apiBaseUrl)

  return {
    async getProjectByKey(projectKey) {
      const result = await requestJson<AdminProject>(
        fetchClient,
        `${baseUrl}/admin/projects/${encodeURIComponent(projectKey)}`,
      )

      return requireResult(result, 'Project API returned an empty response')
    },

    async listScenarios(projectId) {
      const params = new URLSearchParams({ page: '1', size: '100' })

      if (projectId) {
        params.set('projectId', projectId)
      }

      const result = await requestJson<ScenarioList>(
        fetchClient,
        `${baseUrl}/admin/scenarios?${params}`,
      )

      return result?.items ?? []
    },

    async getScenario(scenarioId) {
      const result = await requestJson<AdminScenarioWithSteps>(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}`,
      )

      return requireResult(result, 'Scenario API returned an empty response')
    },

    async createScenario(request) {
      const result = await requestJson<AdminScenario>(
        fetchClient,
        `${baseUrl}/admin/scenarios`,
        jsonRequest('POST', request),
      )

      return requireResult(result, 'Scenario API returned an empty response')
    },

    async updateScenario(scenarioId, request) {
      const result = await requestJson<AdminScenario>(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}`,
        jsonRequest('PATCH', request),
      )

      return requireResult(result, 'Scenario API returned an empty response')
    },

    async publishScenario(scenarioId) {
      const result = await requestJson<AdminScenario>(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}/publish`,
        { method: 'POST' },
      )

      return requireResult(result, 'Publish API returned an empty response')
    },

    async unpublishScenario(scenarioId) {
      await requestVoid(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}/unpublish`,
        { method: 'POST' },
      )
    },

    async createStep(scenarioId, request) {
      const result = await requestJson<AdminStep>(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}/steps`,
        jsonRequest('POST', request),
      )

      return requireResult(result, 'Step API returned an empty response')
    },

    async updateStep(scenarioId, stepId, request) {
      const result = await requestJson<AdminStep>(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}/steps/${encodeURIComponent(stepId)}`,
        jsonRequest('PATCH', request),
      )

      return requireResult(result, 'Step API returned an empty response')
    },

    async deleteStep(scenarioId, stepId) {
      await requestVoid(
        fetchClient,
        `${baseUrl}/admin/scenarios/${encodeURIComponent(scenarioId)}/steps/${encodeURIComponent(stepId)}`,
        { method: 'DELETE' },
      )
    },

    async getAnalytics(scenarioId) {
      const result = await requestJson<AdminAnalytics>(
        fetchClient,
        `${baseUrl}/admin/analytics/${encodeURIComponent(scenarioId)}`,
      )

      if (!result) {
        throw new Error('Analytics API returned an empty response')
      }

      return result
    },

    async generateReport(scenarioId) {
      const result = await requestJson<AnalyticsReportResponse>(
        fetchClient,
        `${baseUrl}/admin/analytics/${encodeURIComponent(scenarioId)}/report`,
        { method: 'POST' },
      )

      if (!result?.filename) {
        throw new Error('Report API returned an empty filename')
      }

      return result.filename
    },

    resolveReportDownloadUrl(scenarioId, reportLocation) {
      if (/^https?:\/\//i.test(reportLocation)) {
        return reportLocation
      }

      const params = new URLSearchParams({ filename: reportLocation })
      return `${baseUrl}/admin/analytics/${encodeURIComponent(scenarioId)}/report?${params}`
    },
  }
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function requireResult<T>(result: T | null, message: string): T {
  if (result === null) {
    throw new Error(message)
  }

  return result
}
