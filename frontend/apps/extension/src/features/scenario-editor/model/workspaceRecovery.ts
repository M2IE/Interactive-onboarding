import { ApiError } from '@interactive-onboarding/api-client'
import type {
  PageDraftResult,
  ScenarioDraft,
} from '../../../entities/draft/model/types'
import type { TabWorkspaceSnapshot } from './types'

export type SnapshotResolution =
  | { status: 'restore'; snapshot: TabWorkspaceSnapshot }
  | { status: 'remote'; result: PageDraftResult }
  | {
      status: 'conflict'
      localDraft: ScenarioDraft
      result: PageDraftResult
    }

export function resolveSnapshot(
  snapshot: TabWorkspaceSnapshot,
  result: PageDraftResult,
): SnapshotResolution {
  const hasLocalChanges =
    snapshot.save.status === 'dirty' || snapshot.save.status === 'error'
  const isSameDraft = snapshot.draft.id
    ? snapshot.draft.id === result.draft?.id
    : !result.draft

  if (isSameDraft) {
    return { status: 'restore', snapshot }
  }

  if (hasLocalChanges || snapshot.interaction.status === 'waiting_navigation') {
    return {
      status: 'conflict',
      localDraft: snapshot.draft,
      result,
    }
  }

  return { status: 'remote', result }
}

export function rebaseLocalDraft(
  localDraft: ScenarioDraft,
  remoteDraft?: ScenarioDraft,
): ScenarioDraft {
  return {
    ...localDraft,
    id: remoteDraft?.id,
    projectId: remoteDraft?.projectId ?? localDraft.projectId,
    steps: localDraft.steps.map((step) => ({
      ...step,
      id: createLocalId(),
      persisted: false,
    })),
  }
}

export function isScenarioEditConflict(error: unknown) {
  return (
    (error instanceof ApiError &&
      (error.status === 409 || error.code === 'scenario_not_editable')) ||
    (error instanceof Error && /scenario not editable/i.test(error.message))
  )
}

function createLocalId() {
  const id = globalThis.crypto?.randomUUID?.()

  return id ? `local-${id}` : `local-${Date.now()}-${Math.random()}`
}
