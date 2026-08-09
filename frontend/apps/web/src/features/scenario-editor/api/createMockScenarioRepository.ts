import type { OnboardingScenario } from '@interactive-onboarding/shared'
import {
  readScenarios,
  resetScenarios as resetStoredScenarios,
  writeScenarios,
} from '@/shared/api/mockOnboardingApi'
import type { ScenarioRepository } from './types'
import { createScenarioDraft, createScenarioStep } from './scenarioFactory'

export function createMockScenarioRepository(): ScenarioRepository {
  return {
    source: 'mock',

    async listScenarios() {
      return readScenarios()
    },

    async createScenario() {
      const scenario = createScenarioDraft()
      writeScenarios([scenario, ...readScenarios()])
      return scenario
    },

    async addStep(scenario) {
      const nextOrder = getNextOrder(scenario)
      const updated = {
        ...scenario,
        status: 'draft' as const,
        updatedAt: new Date().toISOString(),
        steps: [
          ...scenario.steps,
          createScenarioStep(scenario.versionId, nextOrder),
        ],
      }
      storeScenario(updated)
      return updated
    },

    async saveScenario(scenario) {
      storeScenario(scenario)
      return scenario
    },

    async publishScenario(scenario) {
      const nextVersion = scenario.version + 1
      const versionId = `${scenario.id}-v${nextVersion}`
      const publishedAt = new Date().toISOString()
      const published: OnboardingScenario = {
        ...scenario,
        status: 'published',
        version: nextVersion,
        versionId,
        publishedAt,
        updatedAt: publishedAt,
        steps: scenario.steps.map((step) => ({ ...step, versionId })),
      }
      storeScenario(published)
      return published
    },

    async unpublishScenario(scenario) {
      const updatedAt = new Date().toISOString()
      const draft: OnboardingScenario = {
        ...scenario,
        status: 'draft',
        publishedAt: undefined,
        updatedAt,
      }

      storeScenario(draft)
      return draft
    },

    async resetScenarios() {
      resetStoredScenarios()
      return readScenarios()
    },
  }
}

function getNextOrder(scenario: OnboardingScenario) {
  return scenario.steps.length === 0
    ? 1
    : Math.max(...scenario.steps.map((step) => step.order)) + 1
}

function storeScenario(scenario: OnboardingScenario) {
  const scenarios = readScenarios()
  const nextScenarios = scenarios.some((item) => item.id === scenario.id)
    ? scenarios.map((item) => (item.id === scenario.id ? scenario : item))
    : [scenario, ...scenarios]

  writeScenarios(nextScenarios)
}
