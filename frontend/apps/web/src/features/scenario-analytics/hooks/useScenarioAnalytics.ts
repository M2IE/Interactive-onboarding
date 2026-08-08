import { useMemo, useState } from 'react'
import type { OnboardingScenario } from '@interactive-onboarding/shared'
import {
  clearEvents,
  downloadAnalyticsPdf,
  readEvents,
} from '@/shared/api/mockOnboardingApi'
import {
  errorState,
  idleState,
  loadingState,
  successState,
  type AsyncState,
} from '@/shared/lib/asyncState'
import {
  buildAnalyticsSummaryFromEvents,
  buildStepFunnelFromEvents,
} from '../model/analytics'

type ReportResult = {
  message: string
}

export function useScenarioAnalytics(scenario?: OnboardingScenario) {
  const [events, setEvents] = useState(readEvents)
  const [reportState, setReportState] =
    useState<AsyncState<ReportResult>>(() => idleState())

  const summary = useMemo(
    () => buildAnalyticsSummaryFromEvents(events),
    [events],
  )
  const funnel = useMemo(
    () => (scenario ? buildStepFunnelFromEvents(scenario, events) : []),
    [events, scenario],
  )

  function refreshEvents() {
    setEvents(readEvents())
  }

  function resetAnalytics() {
    clearEvents()
    setEvents([])
    setReportState(idleState())
  }

  function downloadReport() {
    if (!scenario) {
      return
    }

    setReportState(loadingState())

    try {
      downloadAnalyticsPdf(scenario)
      setReportState(
        successState({
          message: 'PDF-отчет сформирован и отправлен на скачивание',
        }),
      )
    } catch (error) {
      setReportState(
        errorState(
          error instanceof Error
            ? error.message
            : 'Не удалось сформировать PDF-отчет',
        ),
      )
    }
  }

  return {
    events,
    funnel,
    reportState,
    summary,
    downloadReport,
    refreshEvents,
    resetAnalytics,
  }
}
