import { describe, expect, it } from '@jest/globals'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { resolveScenarioDeepLink } from './deepLink'

describe('scenario editor deep-link', () => {
  it('selects a scenario that exists in the loaded workspace', () => {
    const scenario = defaultScenarios[0]

    expect(
      resolveScenarioDeepLink([scenario], scenario.id),
    ).toEqual({ status: 'found', scenarioId: scenario.id })
  })

  it('reports an unavailable scenario without changing the workspace', () => {
    expect(resolveScenarioDeepLink(defaultScenarios, 'missing-id')).toEqual({
      status: 'missing',
      scenarioId: 'missing-id',
    })
  })
})
