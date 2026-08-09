import { describe, expect, it } from '@jest/globals'
import type { OnboardingScenario } from '@interactive-onboarding/shared'
import { defaultScenario } from '@/entities/scenario/defaultScenario'
import {
  addScenarioStep,
  buildInitialScenarioEditorState,
  publishScenario,
  scenarioEditorReducer,
  updateScenarioMeta,
  updateStep,
} from './scenarioEditorSlice'

describe('scenarioEditorReducer', () => {
  it('marks a published scenario as draft when a step changes', () => {
    const scenario = cloneScenario()
    const state = buildInitialScenarioEditorState([scenario])

    const nextState = scenarioEditorReducer(
      state,
      updateStep({
        scenarioId: scenario.id,
        stepId: scenario.steps[0].id,
        patch: { title: 'Обновленный заголовок' },
      }),
    )

    expect(nextState.scenarios[0].status).toBe('draft')
    expect(nextState.scenarios[0].steps[0].title).toBe(
      'Обновленный заголовок',
    )
  })

  it('uses the published scenario returned by the repository', () => {
    const scenario = { ...cloneScenario(), status: 'draft' as const }
    const state = buildInitialScenarioEditorState([scenario])
    const published = {
      ...scenario,
      status: 'published' as const,
      version: scenario.version + 1,
      versionId: `${scenario.id}-server-version`,
      steps: scenario.steps.map((step) => ({
        ...step,
        versionId: `${scenario.id}-server-version`,
      })),
    }

    const nextState = scenarioEditorReducer(
      state,
      publishScenario.fulfilled(published, 'request-1', scenario),
    )
    const stored = nextState.scenarios[0]

    expect(stored.status).toBe('published')
    expect(stored.version).toBe(scenario.version + 1)
    expect(stored.steps.every((step) => step.versionId === stored.versionId))
      .toBe(true)
    expect(nextState.workflow).toEqual({
      status: 'published',
      scenarioId: scenario.id,
    })
  })

  it('removes the superseded published copy for the same page', () => {
    const draft = { ...cloneScenario(), id: 'draft-id', status: 'draft' as const }
    const previousPublished = {
      ...cloneScenario(),
      id: 'published-v1',
      status: 'published' as const,
    }
    const published = {
      ...draft,
      id: 'published-v2',
      status: 'published' as const,
    }
    const state = buildInitialScenarioEditorState([draft, previousPublished])

    const nextState = scenarioEditorReducer(
      state,
      publishScenario.fulfilled(published, 'request-publish', draft),
    )

    expect(nextState.scenarios.map((scenario) => scenario.id)).toEqual([
      'published-v2',
      'draft-id',
    ])
    expect(nextState.selectedScenarioId).toBe('published-v2')
  })

  it('adds a step without unsupported custom button labels', () => {
    const scenario = cloneScenario()
    const state = buildInitialScenarioEditorState([scenario])
    const added = {
      ...scenario,
      steps: [
        ...scenario.steps,
        {
          ...scenario.steps[0],
          id: 'step-from-api',
          order: scenario.steps.length + 1,
        },
      ],
    }

    const nextState = scenarioEditorReducer(
      state,
      addScenarioStep.fulfilled(added, 'request-2', scenario),
    )
    const addedStep = nextState.scenarios[0].steps.at(-1)

    expect(addedStep).toBeDefined()
    expect(addedStep && 'primaryActionLabel' in addedStep).toBe(false)
    expect(addedStep && 'backActionLabel' in addedStep).toBe(false)
    expect(addedStep && 'pagePath' in addedStep).toBe(false)
  })

  it('stores a custom page path on the scenario', () => {
    const scenario = cloneScenario()
    const state = buildInitialScenarioEditorState([scenario])

    const nextState = scenarioEditorReducer(
      state,
      updateScenarioMeta({
        scenarioId: scenario.id,
        patch: { url: '/custom/listing/create' },
      }),
    )

    expect(nextState.scenarios[0].url).toBe('/custom/listing/create')
    expect(nextState.scenarios[0].steps[0]).not.toHaveProperty('pagePath')
  })
})

function cloneScenario(): OnboardingScenario {
  return JSON.parse(JSON.stringify(defaultScenario)) as OnboardingScenario
}
