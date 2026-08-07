import type { ScenarioEditorState } from './scenarioEditorSlice'

export const selectScenarios = (state: ScenarioEditorState) => state.scenarios

export const selectWorkflow = (state: ScenarioEditorState) => state.workflow

export const selectActiveScenario = (state: ScenarioEditorState) =>
  state.scenarios.find((scenario) => scenario.id === state.selectedScenarioId) ??
  state.scenarios[0]

export const selectActiveStep = (state: ScenarioEditorState) => {
  const scenario = selectActiveScenario(state)

  return (
    scenario?.steps.find((step) => step.id === state.selectedStepId) ??
    scenario?.steps[0]
  )
}
