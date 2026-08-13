import {
  type AdminApiClient,
  type AdminScenarioWithSteps,
} from '@interactive-onboarding/api-client'
import type {
  PageDraftResult,
  ScenarioDraft,
  StepDraft,
} from '../../../entities/draft/model/types'

export type ExtensionScenarioRepository = {
  findPageDraft: (pathname: string) => Promise<PageDraftResult>
  saveDraft: (draft: ScenarioDraft) => Promise<ScenarioDraft>
}

export function createExtensionScenarioRepository(
  apiClient: AdminApiClient,
  projectKey: string,
): ExtensionScenarioRepository {
  let projectIdPromise: Promise<string> | undefined

  async function getProjectId() {
    projectIdPromise ??= apiClient
      .getProjectByKey(projectKey)
      .then((project) => project.id)

    return projectIdPromise
  }

  return {
    async findPageDraft(pathname) {
      const projectId = await getProjectId()
      const scenarios = await apiClient.listScenarios(projectId)
      const matchingScenarios = scenarios.filter(
        (scenario) => scenario.url === pathname,
      )
      const draftScenario = matchingScenarios
        .filter((scenario) => scenario.status === 'draft')
        .toSorted((left, right) =>
          (right.updatedAt ?? '').localeCompare(left.updatedAt ?? ''),
        )[0]

      return {
        projectId,
        draft: draftScenario
          ? mapScenario(await apiClient.getScenario(draftScenario.id))
          : undefined,
        hasPublishedScenario: matchingScenarios.some(
          (scenario) => scenario.status === 'published',
        ),
      }
    },

    async saveDraft(draft) {
      const projectId = await getProjectId()
      let scenarioId = draft.id

      if (!scenarioId) {
        const scenario = await apiClient.createScenario({
          projectId,
          name: draft.name,
          url: draft.url,
        })
        scenarioId = scenario.id
      } else {
        await apiClient.updateScenario(scenarioId, {
          name: draft.name,
          url: draft.url,
        })
      }

      const remoteScenario = await apiClient.getScenario(scenarioId)
      const remoteStepIds = new Set(remoteScenario.steps.map((step) => step.id))
      const retainedStepIds = new Set(
        draft.steps.filter((step) => step.persisted).map((step) => step.id),
      )

      await Promise.all(
        remoteScenario.steps
          .filter((step) => !retainedStepIds.has(step.id))
          .map((step) => apiClient.deleteStep(scenarioId, step.id)),
      )

      const persistedSteps: StepDraft[] = []

      for (const step of draft.steps.toSorted(
        (left, right) => left.order - right.order,
      )) {
        if (step.persisted && remoteStepIds.has(step.id)) {
          const updated = await apiClient.updateStep(scenarioId, step.id, {
            selector: step.selector,
            title: step.title,
            body: step.body,
            nextUrl: step.nextUrl ?? '',
          })
          persistedSteps.push(mapStep(updated))
          continue
        }

        const created = await apiClient.createStep(scenarioId, {
          selector: step.selector,
          title: step.title,
          body: step.body,
          nextUrl: step.nextUrl || undefined,
        })
        persistedSteps.push(mapStep(created))
      }

      if (persistedSteps.length > 0) {
        await apiClient.reorderSteps(scenarioId, {
          order: persistedSteps.map((step, index) => ({
            stepId: step.id,
            orderNum: index + 1,
          })),
        })
      }

      return mapScenario(await apiClient.getScenario(scenarioId))
    },
  }
}

function mapScenario(scenario: AdminScenarioWithSteps): ScenarioDraft {
  return {
    id: scenario.id,
    projectId: scenario.projectId,
    name: scenario.name,
    url: scenario.url,
    steps: scenario.steps
      .toSorted((left, right) => left.orderNum - right.orderNum)
      .map(mapStep),
  }
}

function mapStep(step: AdminScenarioWithSteps['steps'][number]): StepDraft {
  return {
    id: step.id,
    persisted: true,
    order: step.orderNum,
    selector: step.selector,
    title: step.title,
    body: step.body,
    nextUrl: step.nextUrl,
  }
}
