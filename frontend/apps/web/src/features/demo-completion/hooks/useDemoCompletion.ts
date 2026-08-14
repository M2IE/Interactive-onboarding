import { useCallback, useState } from 'react'
import {
  resetOnboardingSession,
  type OnboardingEventHandler,
} from '@m2ie/onboarding-sdk'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '@/shared/config/routes'

export type DemoOutcome = 'completed' | 'dismissed'

export function useDemoCompletion() {
  const navigate = useNavigate()
  const [outcome, setOutcome] = useState<DemoOutcome | null>(null)
  const [runId, setRunId] = useState(0)

  const completeDemo = useCallback(() => {
    setOutcome('completed')
  }, [])

  const dismissDemo = useCallback(() => {
    setOutcome('dismissed')
  }, [])

  const handleOnboardingEvent = useCallback<OnboardingEventHandler>((event) => {
    if (event.type === 'scenario_dismissed') {
      setOutcome('dismissed')
    }
  }, [])

  const repeatDemo = useCallback(() => {
    resetOnboardingSession()
    setOutcome(null)
    setRunId((value) => value + 1)
    navigate(appRoutes.demo.profile, { replace: true })
  }, [navigate])

  const returnHome = useCallback(() => {
    resetOnboardingSession()
    setOutcome(null)
    navigate(appRoutes.home, { replace: true })
  }, [navigate])

  return {
    completeDemo,
    dismissDemo,
    handleOnboardingEvent,
    outcome,
    repeatDemo,
    returnHome,
    runId,
  }
}
