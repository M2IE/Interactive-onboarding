import {
  createAdminApiClient,
  type AdminFlowDetails,
  type AdminProject,
  type AdminScenarioWithSteps,
  type FetchClient,
} from '@interactive-onboarding/api-client'
import type {
  OnboardingScenario,
  OnboardingStep,
} from '@m2ie/onboarding-sdk'
import type { ScenarioRepository } from './types'
import {
  createScenarioDraft,
  createScenarioStep,
  removeScenarioStep,
} from './scenarioFactory'

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
    const flow = await findScenarioFlow(project.id, scenario)

    return mapScenario(project, scenario, flow)
  }

  async function listFlowDetails(projectId: string) {
    const flows = await apiClient.listFlows(projectId)
    return Promise.all(flows.map((flow) => apiClient.getFlow(flow.id)))
  }

  async function findScenarioFlow(
    projectId: string,
    scenario: AdminScenarioWithSteps,
  ) {
    const flows = await listFlowDetails(projectId)
    return flows.find((flow) =>
      flow.scenarios.some(
        (item) =>
          item.scenarioId === scenario.id ||
          (scenario.status === 'draft' && item.url === scenario.url),
      ),
    )
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
    const [scenarios, flows] = await Promise.all([
      apiClient.listScenarios(project.id),
      listFlowDetails(project.id),
    ])

    return Promise.all(
      scenarios.map(async (scenario) => {
        const details = await apiClient.getScenario(scenario.id)
        const flow = flows.find((item) =>
          item.scenarios.some(
            (member) =>
              member.scenarioId === scenario.id ||
              (details.status === 'draft' && member.url === details.url),
          ),
        )
        return mapScenario(project, details, flow)
      }),
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

    async deleteStep(scenario, stepId) {
      await apiClient.deleteStep(scenario.id, stepId)
      return removeScenarioStep(scenario, stepId)
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
  flow?: AdminFlowDetails,
): OnboardingScenario {
  const versionId = scenario.id
  const membership = flow?.scenarios.find(
    (item) =>
      item.scenarioId === scenario.id ||
      (scenario.status === 'draft' && item.url === scenario.url),
  )

  return {
    id: scenario.id,
    projectId: scenario.projectId,
    projectKey: project.projectKey,
    flowId: flow?.id,
    flowName: flow?.name,
    flowKey: flow?.flowKey ?? '',
    flowOrder: membership?.orderNum ?? 0,
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
