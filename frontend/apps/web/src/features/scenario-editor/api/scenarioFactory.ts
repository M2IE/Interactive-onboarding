import type {
  OnboardingScenario,
  OnboardingStep,
} from '@m2ie/onboarding-sdk'
import { defaultScenario } from '@/entities/scenario/defaultScenario'

export function createScenarioDraft(now = new Date()): OnboardingScenario {
  const timestamp = now.getTime()
  const isoDate = now.toISOString()
  const id = `scenario-${timestamp}`

  return {
    id,
    projectId: defaultScenario.projectId,
    projectKey: defaultScenario.projectKey,
    flowKey: id,
    flowOrder: 1,
    name: 'Новый сценарий онбординга',
    description: '',
    url: `/demo/custom-${timestamp}`,
    status: 'draft',
    version: 1,
    versionId: id,
    createdAt: isoDate,
    updatedAt: isoDate,
    steps: [createScenarioStep(id, 1, timestamp)],
  }
}

export function createScenarioStep(
  versionId: string,
  order: number,
  timestamp = Date.now(),
): OnboardingStep {
  return {
    id: `step-${timestamp}-${order}`,
    versionId,
    order,
    selector: '[data-onboarding-id="target"]',
    title: 'Новый шаг',
    body: 'Опишите, какую проблему пользователя решает эта подсказка.',
    placement: 'right',
    completion: 'next_button',
  }
}
