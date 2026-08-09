import { useEffect } from 'react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import type { OnboardingStep } from '@interactive-onboarding/shared'
import { useDispatch, useSelector } from 'react-redux'
import type { ScenarioRepositoryServices } from '../api/types'
import {
  addScenarioStep,
  createScenario,
  loadScenarios,
  publishScenario,
  resetScenarios,
  saveScenario,
  selectScenario,
  selectStep,
  updateScenarioMeta,
  updateStep,
  type ScenarioEditorState,
} from '../model/scenarioEditorSlice'
import {
  selectActiveScenario,
  selectActiveStep,
  selectScenarios,
  selectWorkflow,
} from '../model/selectors'

type ScenarioEditorRootState = {
  scenarioEditor: ScenarioEditorState
}

type ScenarioEditorDispatch = ThunkDispatch<
  ScenarioEditorRootState,
  ScenarioRepositoryServices,
  UnknownAction
>

const useScenarioEditorDispatch = useDispatch.withTypes<ScenarioEditorDispatch>()
const useScenarioEditorSelector =
  useSelector.withTypes<ScenarioEditorRootState>()

export function useScenarioEditor() {
  const dispatch = useScenarioEditorDispatch()
  const scenarios = useScenarioEditorSelector((state) =>
    selectScenarios(state.scenarioEditor),
  )
  const activeScenario = useScenarioEditorSelector((state) =>
    selectActiveScenario(state.scenarioEditor),
  )
  const activeStep = useScenarioEditorSelector((state) =>
    selectActiveStep(state.scenarioEditor),
  )
  const workflow = useScenarioEditorSelector((state) =>
    selectWorkflow(state.scenarioEditor),
  )

  useEffect(() => {
    if (workflow.status === 'idle') {
      void dispatch(loadScenarios())
    }
  }, [dispatch, workflow.status])

  const isPublished = activeScenario?.status === 'published'

  return {
    activeScenario,
    activeStep,
    isBusy: workflow.status === 'loading',
    isPublished,
    scenarios,
    workflow,
    addStep: () => {
      if (activeScenario && !isPublished) {
        void dispatch(addScenarioStep(activeScenario))
      }
    },
    createDraft: () => {
      void dispatch(createScenario())
    },
    publishActiveScenario: () => {
      if (activeScenario && !isPublished) {
        void dispatch(publishScenario(activeScenario))
      }
    },
    reloadScenarios: () => {
      void dispatch(resetScenarios())
    },
    saveActiveScenario: () => {
      if (activeScenario && !isPublished) {
        void dispatch(saveScenario(activeScenario))
      }
    },
    selectScenario: (scenarioId: string) => dispatch(selectScenario(scenarioId)),
    selectStep: (stepId: string) => dispatch(selectStep(stepId)),
    updateScenarioMeta: (patch: {
      name?: string
      description?: string
      url?: string
    }) => {
      if (activeScenario && !isPublished) {
        dispatch(updateScenarioMeta({ scenarioId: activeScenario.id, patch }))
      }
    },
    updateStep: (patch: Partial<OnboardingStep>) => {
      if (activeScenario && activeStep && !isPublished) {
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
