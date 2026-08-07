import { describe, expect, it } from '@jest/globals'
import type { OnboardingScenario } from '@interactive-onboarding/shared'
import { defaultScenario } from '@/entities/scenario/defaultScenario'
import {
  addStep,
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

  it('publishes a new version and pins all steps to the published version id', () => {
    const scenario = { ...cloneScenario(), status: 'draft' as const }
    const state = buildInitialScenarioEditorState([scenario])

    const nextState = scenarioEditorReducer(
      state,
      publishScenario(scenario.id),
    )
    const published = nextState.scenarios[0]

    expect(published.status).toBe('published')
    expect(published.version).toBe(scenario.version + 1)
    expect(published.steps.every((step) => step.versionId === published.versionId))
      .toBe(true)
  })

  it('adds a step without unsupported custom button labels', () => {
    const scenario = cloneScenario()
    const state = buildInitialScenarioEditorState([scenario])

    const nextState = scenarioEditorReducer(state, addStep(scenario.id))
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
