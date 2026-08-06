import { useEffect } from 'react'
import type { OnboardingStep } from '@interactive-onboarding/shared'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { writeScenarios } from '@/shared/api/mockOnboardingApi'
import {
  addStep,
  createDraft,
  publishScenario,
  restoreDemoScenario,
  selectScenario,
  selectStep,
  updateScenarioMeta,
  updateStep,
} from '../model/scenarioEditorSlice'
import {
  selectActiveScenario,
  selectActiveStep,
  selectScenarios,
  selectWorkflow,
} from '../model/selectors'

export function useScenarioEditor() {
  const dispatch = useAppDispatch()
  const scenarios = useAppSelector((state) =>
    selectScenarios(state.scenarioEditor),
  )
  const activeScenario = useAppSelector((state) =>
    selectActiveScenario(state.scenarioEditor),
  )
  const activeStep = useAppSelector((state) =>
    selectActiveStep(state.scenarioEditor),
  )
  const workflow = useAppSelector((state) => selectWorkflow(state.scenarioEditor))

  useEffect(() => {
    writeScenarios(scenarios)
  }, [scenarios])

  return {
    activeScenario,
    activeStep,
    scenarios,
    workflow,
    addStep: () => {
      if (activeScenario) {
        dispatch(addStep(activeScenario.id))
      }
    },
    createDraft: () => dispatch(createDraft()),
    publishActiveScenario: () => {
      if (activeScenario) {
        dispatch(publishScenario(activeScenario.id))
      }
    },
    restoreDemoScenario: () => dispatch(restoreDemoScenario()),
    selectScenario: (scenarioId: string) => dispatch(selectScenario(scenarioId)),
    selectStep: (stepId: string) => dispatch(selectStep(stepId)),
    updateScenarioMeta: (patch: { name?: string; description?: string }) => {
      if (activeScenario) {
        dispatch(updateScenarioMeta({ scenarioId: activeScenario.id, patch }))
      }
    },
    updateStep: (patch: Partial<OnboardingStep>) => {
      if (activeScenario && activeStep) {
        dispatch(
          updateStep({
            scenarioId: activeScenario.id,
            stepId: activeStep.id,
            patch,
          }),
        )
      }
    },
  }
}
