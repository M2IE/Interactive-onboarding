import type {
  OnboardingApiClient,
  OnboardingEventPayload,
  WidgetConfig,
  WidgetConfigRequest,
} from '@interactive-onboarding/shared'

type HttpClientOptions = {
  apiBaseUrl: string
}

export function createHttpOnboardingClient({
  apiBaseUrl,
}: HttpClientOptions): OnboardingApiClient {
  const baseUrl = apiBaseUrl.replace(/\/$/, '')

  return {
    async getConfig(request: WidgetConfigRequest): Promise<WidgetConfig | null> {
      const params = new URLSearchParams({
        projectKey: request.projectKey,
        pageUrl: request.pageUrl,
        sessionId: request.sessionId,
      })

      if (request.userId) {
        params.set('userId', request.userId)
      }

      const response = await fetch(`${baseUrl}/widget/config?${params}`)

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error('Failed to load onboarding config')
      }

      return response.json() as Promise<WidgetConfig>
    },

    async trackEvent(event: OnboardingEventPayload): Promise<void> {
      await fetch(`${baseUrl}/widget/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
    },
  }
}
