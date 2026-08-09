import {
  createAdminApiClient,
  type AdminProject,
  type AdminScenarioWithSteps,
  type FetchClient,
} from '@interactive-onboarding/api-client'
import type {
  OnboardingScenario,
  OnboardingStep,
} from '@interactive-onboarding/shared'
import type { ScenarioRepository } from './types'
import { createScenarioDraft, createScenarioStep } from './scenarioFactory'

type RealScenarioRepositoryOptions = {
  apiBaseUrl: string
  projectKey: string
  projectId?: string
  fetchClient?: FetchClient
}

export function createRealScenarioRepository({
  apiBaseUrl,
  projectKey,
  projectId,
  fetchClient,
}: RealScenarioRepositoryOptions): ScenarioRepository {
  const apiClient = createAdminApiClient({ apiBaseUrl, fetchClient })
  let projectPromise: Promise<AdminProject> | undefined

  async function getProject() {
    projectPromise ??= projectId
      ? Promise.resolve({ id: projectId, name: projectKey, projectKey })
      : apiClient.getProjectByKey(projectKey)

    return projectPromise
  }

  async function getScenario(scenarioId: string) {
    const [project, scenario] = await Promise.all([
      getProject(),
      apiClient.getScenario(scenarioId),
    ])

    return mapScenario(project, scenario)
  }

  async function saveScenario(scenario: OnboardingScenario) {
    await apiClient.updateScenario(scenario.id, {
      name: scenario.name,
      url: scenario.url,
    })
    await Promise.all(
      scenario.steps.map((step) =>
        apiClient.updateStep(scenario.id, step.id, {
          selector: step.selector,
          title: step.title,
          body: step.body,
          nextUrl: step.nextUrl ?? '',
        }),
      ),
    )

    return getScenario(scenario.id)
  }

  async function listScenarios() {
    const project = await getProject()
    const scenarios = await apiClient.listScenarios(project.id)

    return Promise.all(
      scenarios.map(async (scenario) =>
        mapScenario(project, await apiClient.getScenario(scenario.id)),
      ),
    )
  }

  return {
    source: 'real',
    listScenarios,

    async createScenario() {
      const project = await getProject()
      const draft = createScenarioDraft()
      const scenario = await apiClient.createScenario({
        projectId: project.id,
        name: draft.name,
        url: draft.url,
      })
      const firstStep = draft.steps[0]

      await apiClient.createStep(scenario.id, {
        selector: firstStep.selector,
        title: firstStep.title,
        body: firstStep.body,
      })

      return getScenario(scenario.id)
    },

    async addStep(scenario) {
      const template = createScenarioStep(
        scenario.versionId,
        getNextOrder(scenario),
      )

      await apiClient.createStep(scenario.id, {
        selector: template.selector,
        title: template.title,
        body: template.body,
      })

      return getScenario(scenario.id)
    },

    saveScenario,

    async publishScenario(scenario) {
      await saveScenario(scenario)
      const published = await apiClient.publishScenario(scenario.id)
      return getScenario(published.id)
    },

    async unpublishScenario(scenario) {
      await apiClient.unpublishScenario(scenario.id)
      return getScenario(scenario.id)
    },

    async resetScenarios() {
      return listScenarios()
    },
  }
}

function mapScenario(
  project: AdminProject,
  scenario: AdminScenarioWithSteps,
): OnboardingScenario {
  const versionId = scenario.id

  return {
    id: scenario.id,
    projectId: scenario.projectId,
    projectKey: project.projectKey,
    flowKey: scenario.id,
    flowOrder: 1,
    name: scenario.name,
    description: '',
    url: scenario.url,
    status: scenario.status,
    version: 1,
    versionId,
    createdAt: scenario.createdAt ?? '',
    updatedAt: scenario.updatedAt ?? scenario.createdAt ?? '',
    publishedAt:
      scenario.status === 'published'
        ? scenario.updatedAt ?? scenario.createdAt
        : undefined,
    steps: scenario.steps
      .toSorted((left, right) => left.orderNum - right.orderNum)
      .map((step) => mapStep(versionId, step)),
  }
}

function mapStep(
  versionId: string,
  step: AdminScenarioWithSteps['steps'][number],
): OnboardingStep {
  return {
    id: step.id,
    versionId,
    order: step.orderNum,
    selector: step.selector,
    title: step.title,
    body: step.body,
    placement: 'right',
    completion: 'next_button',
    nextUrl: step.nextUrl,
  }
}

function getNextOrder(scenario: OnboardingScenario) {
  return scenario.steps.length === 0
    ? 1
    : Math.max(...scenario.steps.map((step) => step.order)) + 1
}
