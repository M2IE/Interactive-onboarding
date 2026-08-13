import { describe, expect, it } from '@jest/globals'
import type { TabWorkspaceSnapshot } from './types'
import { ApiError } from '@interactive-onboarding/api-client'
import {
  isScenarioEditConflict,
  rebaseLocalDraft,
  resolveSnapshot,
} from './workspaceRecovery'

const snapshot: TabWorkspaceSnapshot = {
  settings: {
    platformUrl: 'https://platform.example.com',
    projectKey: 'demo',
  },
  draft: {
    id: 'draft-old',
    projectId: 'project-1',
    name: 'Local changes',
    url: '/products',
    steps: [
      {
        id: 'step-old',
        persisted: true,
        order: 1,
        selector: '[data-onboarding-id="products"]',
        title: 'Products',
        body: 'Choose a product',
      },
    ],
  },
  selectedStepId: 'step-old',
  interaction: { status: 'idle' },
  save: { status: 'dirty' },
  hasPublishedScenario: false,
}

describe('extension workspace recovery', () => {
  it('restores local edits while the same draft is still editable', () => {
    expect(
      resolveSnapshot(snapshot, {
        projectId: 'project-1',
        draft: { ...snapshot.draft },
        hasPublishedScenario: false,
      }).status,
    ).toBe('restore')
  })

  it('reports a conflict when another editable draft replaced local changes', () => {
    expect(
      resolveSnapshot(snapshot, {
        projectId: 'project-1',
        draft: { ...snapshot.draft, id: 'draft-current' },
        hasPublishedScenario: true,
      }).status,
    ).toBe('conflict')
  })

  it('rebases local steps without reusing stale backend identifiers', () => {
    const rebased = rebaseLocalDraft(snapshot.draft, {
      ...snapshot.draft,
      id: 'draft-current',
    })

    expect(rebased.id).toBe('draft-current')
    expect(rebased.steps[0]).toMatchObject({ persisted: false })
    expect(rebased.steps[0]?.id).not.toBe('step-old')
  })

  it('recognizes backend edit conflicts without hiding unrelated errors', () => {
    expect(
      isScenarioEditConflict(
        new ApiError('scenario not editable', 409, 'scenario_not_editable'),
      ),
    ).toBe(true)
    expect(isScenarioEditConflict(new Error('offline'))).toBe(false)
  })
})
