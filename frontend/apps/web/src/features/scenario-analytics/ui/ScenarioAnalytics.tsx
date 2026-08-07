import type {
  AnalyticsSummary,
  OnboardingEventPayload,
} from '@interactive-onboarding/shared'
import { Button, Metric, Panel } from '@interactive-onboarding/ui'
import type { AsyncState } from '@/shared/lib/asyncState'
import type { StepFunnelRow } from '../model/analytics'

type ReportResult = {
  message: string
}

type ScenarioAnalyticsProps = {
  events: OnboardingEventPayload[]
  funnel: StepFunnelRow[]
  reportState: AsyncState<ReportResult>
  summary: AnalyticsSummary
  onDownloadReport: () => void
  onResetAnalytics: () => void
}

export function ScenarioAnalytics({
  events,
  funnel,
  reportState,
  summary,
  onDownloadReport,
  onResetAnalytics,
}: ScenarioAnalyticsProps) {
  return (
    <div className="analytics-grid">
      <Metric
        caption="Уникальные старты демо-сессии"
        label="Запусков"
        value={String(summary.started)}
      />
      <Metric
        caption="Пользователь дошел до конца"
        label="Завершений"
        value={String(summary.completed)}
      />
      <Metric
        caption="От всех запусков"
        label="Конверсия"
        value={`${summary.completionRate}%`}
      />
      <Metric
        caption="Селектор не найден на странице"
        label="Ошибок таргета"
        value={String(summary.targetMisses)}
      />

      <Panel
        action={
          <div className="analytics-actions">
            <Button onClick={onResetAnalytics}>Очистить</Button>
            <Button onClick={onDownloadReport} variant="primary">
              Скачать PDF
            </Button>
          </div>
        }
        className="analytics-funnel"
        title="Воронка по шагам"
      >
        <table>
          <thead>
            <tr>
              <th>Шаг</th>
              <th>Страница</th>
              <th>Показы</th>
              <th>Переходы</th>
              <th>Конверсия</th>
            </tr>
          </thead>
          <tbody>
            {funnel.map(({ step, views, completed, conversion }) => (
              <tr key={step.id}>
                <td>
                  {step.order}. {step.title}
                </td>
                <td>{step.pagePath}</td>
                <td>{views}</td>
                <td>{completed}</td>
                <td>{conversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportState.status === 'loading' && (
          <p className="report-status">Формируем PDF-отчет</p>
        )}
        {reportState.status === 'success' && (
          <p className="report-status">{reportState.data.message}</p>
        )}
        {reportState.status === 'error' && (
          <p className="report-status report-status--error">
            {reportState.error}
          </p>
        )}
      </Panel>

      <Panel className="event-feed" title="Последние события">
        {events.length === 0 ? (
          <p>Пока нет событий. Откройте демо и пройдите онбординг.</p>
        ) : (
          events
            .toReversed()
            .slice(0, 8)
            .map((event) => (
              <div className="event-row" key={event.eventKey}>
                <strong>{event.type}</strong>
                <span>{event.stepId ?? event.scenarioId}</span>
              </div>
            ))
        )}
      </Panel>
    </div>
  )
}
