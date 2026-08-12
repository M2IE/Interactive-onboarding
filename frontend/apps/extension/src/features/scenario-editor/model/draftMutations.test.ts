import { describe, expect, it } from '@jest/globals'
import type { ScenarioDraft } from '../../../entities/draft/model/types'
import { deleteDraftStep, moveDraftStep, updateDraftStep } from './draftMutations'

describe('draft mutations', () => {
  const draft: ScenarioDraft = {
    projectId: 'project-1',
    name: 'Scenario',
    url: '/products',
    steps: [
      {
        id: 'step-1',
        persisted: true,
        order: 1,
        selector: '#one',
        title: 'One',
        body: 'Body',
      },
      {
        id: 'step-2',
        persisted: true,
        order: 2,
        selector: '#two',
        title: 'Two',
        body: 'Body',
      },
    ],
  }

  it('updates one step without mutating the source draft', () => {
    const nextDraft = updateDraftStep(draft, 'step-1', { title: 'Updated' })

    expect(nextDraft.steps[0].title).toBe('Updated')
    expect(draft.steps[0].title).toBe('One')
  })

  it('moves steps and normalizes their order', () => {
    const nextDraft = moveDraftStep(draft, 'step-2', -1)

    expect(nextDraft.steps.map(({ id, order }) => ({ id, order }))).toEqual([
      { id: 'step-2', order: 1 },
      { id: 'step-1', order: 2 },
    ])
  })

  it('removes a step and closes order gaps', () => {
    expect(deleteDraftStep(draft, 'step-1').steps).toEqual([
      expect.objectContaining({ id: 'step-2', order: 1 }),
    ])
  })
})
