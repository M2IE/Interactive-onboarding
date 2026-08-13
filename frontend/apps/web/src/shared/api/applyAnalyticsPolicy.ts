import type { OnboardingApiClient } from '@m2ie/onboarding-sdk'

export function applyAnalyticsPolicy(
  apiClient: OnboardingApiClient,
  analyticsEnabled: boolean,
): OnboardingApiClient {
  if (analyticsEnabled) return apiClient

  return {
    ...apiClient,
    trackEvent: async () => undefined,
  }
}
