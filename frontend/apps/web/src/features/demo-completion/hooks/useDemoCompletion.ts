import { useCallback, useState } from 'react'
import { resetOnboardingSession } from '@m2ie/onboarding-sdk'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '@/shared/config/routes'

export function useDemoCompletion() {
  const navigate = useNavigate()
  const [isComplete, setIsComplete] = useState(false)
  const [runId, setRunId] = useState(0)

  const completeDemo = useCallback(() => {
    setIsComplete(true)
  }, [])

  const repeatDemo = useCallback(() => {
    resetOnboardingSession()
    setIsComplete(false)
    setRunId((value) => value + 1)
    navigate(appRoutes.demo.profile, { replace: true })
  }, [navigate])

  const returnHome = useCallback(() => {
    resetOnboardingSession()
    setIsComplete(false)
    navigate(appRoutes.home, { replace: true })
  }, [navigate])

  return {
    completeDemo,
    isComplete,
    repeatDemo,
    returnHome,
    runId,
  }
}
