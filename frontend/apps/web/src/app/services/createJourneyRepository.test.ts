import type { AnalyticsRepository } from '@/features/scenario-analytics'
import type { ScenarioRepository } from '@/features/scenario-editor/api/types'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { createJourneyRepository } from './createJourneyRepository'

describe('createJourneyRepository', () => {
  it('returns only published scenarios and maps analytics', async () => {
    const scenarioRepository = {
      source: 'mock',
      listScenarios: jest.fn().mockResolvedValue([
        defaultScenarios[0],
        { ...defaultScenarios[1], status: 'draft' },
      ]),
    } as unknown as ScenarioRepository
    const analyticsRepository = {
      source: 'mock',
      getAnalytics: jest.fn().mockResolvedValue({
        totalViews: 10,
        completed: 7,
        dismissed: 2,
        completionRate: 70,
        steps: [],
      }),
    } as unknown as AnalyticsRepository
    const repository = createJourneyRepository({ analyticsRepository, scenarioRepository })

    await expect(repository.listPublishedScenarios()).resolves.toEqual([defaultScenarios[0]])
    await expect(repository.getMetrics(defaultScenarios[0])).resolves.toEqual({
      views: 10,
      completed: 7,
      conversion: 70,
    })
  })
})
