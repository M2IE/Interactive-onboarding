import type { OnboardingApiClient, OnboardingEventPayload } from '@m2ie/onboarding-sdk'
import { applyAnalyticsPolicy } from './applyAnalyticsPolicy'

describe('applyAnalyticsPolicy', () => {
  const event = {} as OnboardingEventPayload

  it('keeps backend event delivery enabled for the production demo host', async () => {
    const apiClient = createClient()
    const result = applyAnalyticsPolicy(apiClient, true)

    await result.trackEvent(event)

    expect(apiClient.trackEvent).toHaveBeenCalledWith(event)
  })

  it('keeps scenario loading but suppresses backend event delivery in preview', async () => {
    const apiClient = createClient()
    const result = applyAnalyticsPolicy(apiClient, false)

    await result.getConfig({} as never)
    await result.trackEvent(event)

    expect(apiClient.getConfig).toHaveBeenCalled()
    expect(apiClient.trackEvent).not.toHaveBeenCalled()
  })
})

function createClient(): jest.Mocked<OnboardingApiClient> {
  return {
    getConfig: jest.fn().mockResolvedValue(null),
    trackEvent: jest.fn().mockResolvedValue(undefined),
  }
}
