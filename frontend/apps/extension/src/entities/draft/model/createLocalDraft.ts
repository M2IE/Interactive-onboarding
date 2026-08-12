import type { ElementDescriptor } from '@interactive-onboarding/element-selector'
import type { ScenarioDraft, StepDraft } from './types'

export function createLocalScenarioDraft(
  projectId: string,
  pathname: string,
  pageTitle: string,
): ScenarioDraft {
  return {
    projectId,
    name: pageTitle ? `Онбординг: ${pageTitle}` : `Онбординг: ${pathname}`,
    url: pathname,
    steps: [],
  }
}

export function createLocalStep(
  descriptor: ElementDescriptor,
  order: number,
): StepDraft {
  return {
    id: createLocalId(),
    persisted: false,
    order,
    selector: descriptor.selector,
    title: 'Новая подсказка',
    body: 'Объясните пользователю, какое действие нужно выполнить.',
    target: {
      confidence: descriptor.confidence,
      label: descriptor.label,
      matchCount: descriptor.matchCount,
      role: descriptor.role,
      tagName: descriptor.tagName,
      warnings: descriptor.warnings,
    },
  }
}

function createLocalId() {
  const id = globalThis.crypto?.randomUUID?.()

  return id ? `local-${id}` : `local-${Date.now()}-${Math.random()}`
}
