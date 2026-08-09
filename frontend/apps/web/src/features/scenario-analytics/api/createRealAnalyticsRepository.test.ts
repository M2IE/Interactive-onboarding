import { describe, expect, it } from '@jest/globals'
import { mapAdminAnalytics } from './createRealAnalyticsRepository'

describe('real analytics mapper', () => {
  it('maps backend aggregates and calculates conversions', () => {
    const result = mapAdminAnalytics(
      {
        id: 'scenario-1',
        projectId: 'project-1',
        name: 'Profile onboarding',
        url: '/demo/profile',
        status: 'published',
      },
      {
        totalViews: 5,
        completed: 2,
        dismissed: 1,
        steps: [
          {
            stepId: 'step-2',
            title: 'Second',
            orderNum: 2,
            views: 3,
            completed: 1,
          },
          {
            stepId: 'step-1',
            title: 'First',
            orderNum: 1,
            views: 5,
            completed: 4,
          },
        ],
      },
    )

    expect(result.completionRate).toBe(40)
    expect(result.steps).toEqual([
      expect.objectContaining({ id: 'step-1', order: 1, conversion: 80 }),
      expect.objectContaining({ id: 'step-2', order: 2, conversion: 33 }),
    ])
  })
})
