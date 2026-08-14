import type { ElementDescriptor } from '@interactive-onboarding/element-selector'
import { createLocalStep } from '../../../entities/draft/model/createLocalDraft'
import type {
  ScenarioDraft,
  StepDraft,
} from '../../../entities/draft/model/types'

export function addDraftStep(
  draft: ScenarioDraft,
  descriptor: ElementDescriptor,
) {
  const step = createLocalStep(descriptor, draft.steps.length + 1)

  return {
    draft: { ...draft, steps: [...draft.steps, step] },
    step,
  }
}

export function updateDraftStep(
  draft: ScenarioDraft,
  stepId: string,
  patch: Partial<StepDraft>,
): ScenarioDraft {
  return {
    ...draft,
    steps: draft.steps.map((step) =>
      step.id === stepId ? { ...step, ...patch, id: step.id } : step,
    ),
  }
}

export function deleteDraftStep(draft: ScenarioDraft, stepId: string) {
  return normalizeOrder({
    ...draft,
    steps: draft.steps.filter((step) => step.id !== stepId),
  })
}

export function moveDraftStep(
  draft: ScenarioDraft,
  stepId: string,
  direction: -1 | 1,
) {
  const steps = draft.steps.toSorted((left, right) => left.order - right.order)
  const index = steps.findIndex((step) => step.id === stepId)
  const targetIndex = index + direction

  if (index < 0 || targetIndex < 0 || targetIndex >= steps.length) {
    return draft
  }

  const nextSteps = [...steps]
  const [step] = nextSteps.splice(index, 1)
  nextSteps.splice(targetIndex, 0, step)

  return normalizeOrder({ ...draft, steps: nextSteps })
}

function normalizeOrder(draft: ScenarioDraft): ScenarioDraft {
  return {
    ...draft,
    steps: draft.steps.map((step, index) => ({ ...step, order: index + 1 })),
  }
}
