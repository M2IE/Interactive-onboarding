import { beforeEach, describe, expect, it } from '@jest/globals'
import { appRoutes } from '@/shared/config/routes'
import {
  clearEvents,
  getPublishedConfig,
  resetScenarios,
} from './mockOnboardingApi'

describe('mockOnboardingApi', () => {
  beforeEach(() => {
    resetScenarios()
    clearEvents()
  })

  it('returns the page scenario with flow-level progress', () => {
    const config = getPublishedConfig({
      projectKey: 'avito-demo',
      pageUrl: `${appRoutes.demo.auto}?source=test`,
      sessionId: 'session-1',
    })

    expect(config).toMatchObject({
      scenarioId: 'scenario-first-listing-auto',
      pageUrl: appRoutes.demo.auto,
      stepOffset: 3,
      totalSteps: 6,
    })
    expect(config?.steps.map((step) => step.order)).toEqual([1, 2, 3])
  })
})
