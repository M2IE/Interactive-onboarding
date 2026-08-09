import { Button, Metric, Panel, SelectField } from '@interactive-onboarding/ui'
import {
  Activity,
  CheckCircle2,
  Crosshair,
  Download,
  Trash2,
  TrendingUp,
  UserMinus,
} from 'lucide-react'
import type { AsyncState } from '@/shared/lib/asyncState'
import type { AnalyticsWorkspace } from '../model/scenarioAnalyticsSlice'
import type { AnalyticsSource } from '../model/types'

type ReportResult = {
  message: string
}

type ScenarioAnalyticsProps = {
  reportState: AsyncState<ReportResult>
  source: AnalyticsSource
  workspace: AsyncState<AnalyticsWorkspace>
  onDownloadReport: () => void
  onResetAnalytics: () => void
  onRetry: () => void
  onSelectScenario: (scenarioId: string) => void
}

export function ScenarioAnalytics({
  reportState,
  source,
  workspace,
  onDownloadReport,
  onResetAnalytics,
  onRetry,
  onSelectScenario,
}: ScenarioAnalyticsProps) {
  if (workspace.status === 'idle' || workspace.status === 'loading') {
    return (
      <Panel className="analytics-state" title="Загружаем аналитику">
        <p>Получаем опубликованные сценарии и результаты прохождения.</p>
      </Panel>
    )
  }

  if (workspace.status === 'error') {
    return (
      <Panel className="analytics-state" title="Не удалось загрузить аналитику">
        <p className="report-status report-status--error">{workspace.error}</p>
        <Button onClick={onRetry} variant="primary">
          Повторить
        </Button>
      </Panel>
    )
  }

  const { scenarios, selectedScenarioId, analytics } = workspace.data

  if (!selectedScenarioId || !analytics) {
    return (
      <Panel className="analytics-state" title="Нет опубликованных сценариев">
        <p>Опубликуйте сценарий на бэкенде, чтобы увидеть его результаты.</p>
      </Panel>
    )
  }

  return (
    <div className="analytics-workspace">
      <div className="analytics-toolbar">
        <SelectField
          className="analytics-scenario-select"
          label="Опубликованный сценарий"
          options={scenarios.map((scenario) => ({
            label: `${scenario.name} · ${scenario.url}`,
            value: scenario.id,
          }))}
          value={selectedScenarioId}
          onValueChange={onSelectScenario}
        />
      </div>

      <div className="analytics-grid">
        <Metric
          caption="Показы первого шага сценария"
          icon={<Activity aria-hidden="true" size={18} />}
          label="Просмотров"
          value={String(analytics.totalViews)}
        />
        <Metric
          caption="Пользователь дошел до конца"
          icon={<CheckCircle2 aria-hidden="true" size={18} />}
          label="Завершений"
          value={String(analytics.completed)}
        />
        <Metric
          caption="От всех просмотров"
          icon={<TrendingUp aria-hidden="true" size={18} />}
          label="Конверсия"
          value={`${analytics.completionRate}%`}
        />
        <Metric
          caption="Пользователь пропустил онбординг"
          icon={<UserMinus aria-hidden="true" size={18} />}
          label="Пропусков"
          value={String(analytics.dismissed)}
        />
        {source === 'mock' && (
          <Metric
            caption="Селектор не найден на странице"
            icon={<Crosshair aria-hidden="true" size={18} />}
            label="Ошибок таргета"
            value={String(analytics.targetMisses ?? 0)}
          />
        )}

        <Panel
          action={
            <div className="analytics-actions">
              {source === 'mock' && (
                <Button
                  icon={<Trash2 aria-hidden="true" size={16} />}
                  onClick={onResetAnalytics}
                  variant="ghost"
                >
                  Очистить
                </Button>
              )}
              <Button
                disabled={reportState.status === 'loading'}
                icon={<Download aria-hidden="true" size={16} />}
                onClick={onDownloadReport}
                variant="primary"
              >
                Скачать PDF
              </Button>
            </div>
          }
          className="analytics-funnel"
          title="Воронка по шагам"
        >
          <div className="analytics-table-scroll">
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
                {analytics.steps.map((step) => (
                  <tr key={step.id}>
                    <td>
                      {step.order}. {step.title}
                    </td>
                    <td>{step.pageUrl}</td>
                    <td>{step.views}</td>
                    <td>{step.completed}</td>
                    <td>{step.conversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analytics.steps.length === 0 && (
            <p className="report-status">По шагам пока нет данных.</p>
          )}
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

        {source === 'mock' && (
          <Panel className="event-feed" title="Последние события">
            {!analytics.events?.length ? (
              <p>Пока нет событий. Откройте демо и пройдите онбординг.</p>
            ) : (
              analytics.events
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
        )}
      </div>
    </div>
  )
}
