import type { components } from './generated/widget'
import {
  normalizeApiBaseUrl,
  requestJson,
  requestVoid,
  type FetchClient,
} from './http'

export type WidgetScenarioResponse =
  components['schemas']['WidgetScenarioResponse']
export type WidgetEventRequest = components['schemas']['WidgetEventRequest']

export type WidgetScenarioRequest = {
  projectKey: string
  pageUrl: string
}

export type WidgetApiClient = {
  getScenario: (
    request: WidgetScenarioRequest,
  ) => Promise<WidgetScenarioResponse | null>
  postEvent: (event: WidgetEventRequest) => Promise<void>
}

type WidgetApiClientOptions = {
  apiBaseUrl: string
  fetchClient?: FetchClient
}

export function createWidgetApiClient({
  apiBaseUrl,
  fetchClient = fetch,
}: WidgetApiClientOptions): WidgetApiClient {
  const baseUrl = normalizeApiBaseUrl(apiBaseUrl)

  return {
    async getScenario(request) {
      const params = new URLSearchParams({
        projectKey: request.projectKey,
        pageUrl: request.pageUrl,
      })

      return requestJson<WidgetScenarioResponse>(
        fetchClient,
        `${baseUrl}/widget/scenario?${params}`,
        undefined,
        [204, 404],
      )
    },

    async postEvent(event) {
      await requestVoid(fetchClient, `${baseUrl}/widget/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
    },
  }
}
