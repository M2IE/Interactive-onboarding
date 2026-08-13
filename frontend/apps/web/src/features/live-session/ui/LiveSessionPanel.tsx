import { Button } from '@interactive-onboarding/ui'
import {
  CheckCircle2,
  ExternalLink,
  Monitor,
  Play,
  RotateCcw,
  Smartphone,
  StopCircle,
  XCircle,
} from 'lucide-react'
import type { LiveSessionState, LiveViewport } from '../model/types'
import type { OnboardingEventPayload } from '@m2ie/onboarding-sdk'

type LiveSessionPanelProps = {
  state: LiveSessionState
  iframeUrl?: string
  defaultStartUrl?: string
  onReady(): void
  onRestart(): void
  onSetViewport(viewport: LiveViewport): void
  onStart(url: string): void
  onStop(): void
}

export function LiveSessionPanel({
  state,
  iframeUrl,
  defaultStartUrl,
  onReady,
  onRestart,
  onSetViewport,
  onStart,
  onStop,
}: LiveSessionPanelProps) {
  const events = 'events' in state ? state.events : []

  return (
    <section className="live-session" aria-label="Live Session">
      <header className="live-session__header">
        <div>
          <span className="journey-details__label">Live Session</span>
          <h2>Проверка пути</h2>
        </div>
        <div className="live-viewport-toggle" aria-label="Размер демо">
          <button
            aria-label="Десктоп"
            aria-pressed={state.viewport === 'desktop'}
            onClick={() => onSetViewport('desktop')}
            type="button"
          ><Monitor aria-hidden="true" size={17} /></button>
          <button
            aria-label="Мобильный"
            aria-pressed={state.viewport === 'mobile'}
            onClick={() => onSetViewport('mobile')}
            type="button"
          ><Smartphone aria-hidden="true" size={17} /></button>
        </div>
      </header>

      {state.status === 'idle' ? (
        <div className="live-session__empty">
          <div className="live-session__play"><Play aria-hidden="true" size={24} /></div>
          <h3>Пройдите путь глазами пользователя</h3>
          <p>Карта будет подсвечивать страницы и события прямо во время онбординга.</p>
          <Button
            disabled={!defaultStartUrl}
            icon={<Play aria-hidden="true" size={17} />}
            onClick={() => defaultStartUrl && onStart(defaultStartUrl)}
            variant="primary"
          >Запустить</Button>
        </div>
      ) : state.status === 'error' ? (
        <div className="live-session__empty is-error" role="alert">
          <XCircle aria-hidden="true" size={26} />
          <h3>Live Session недоступен</h3>
          <p>{state.error}</p>
          <Button onClick={onStop}>Закрыть</Button>
        </div>
      ) : (
        <>
          <div className="live-session__toolbar">
            <span className={`live-session__status is-${state.status}`}>
              <i /> {getStatusLabel(state.status)}
            </span>
            <div>
              <Button icon={<RotateCcw aria-hidden="true" size={15} />} onClick={onRestart} size="small" variant="ghost">Повторить</Button>
              <Button icon={<StopCircle aria-hidden="true" size={15} />} onClick={onStop} size="small" variant="ghost">Остановить</Button>
              {iframeUrl && (
                <Button
                  icon={<ExternalLink aria-hidden="true" size={15} />}
                  onClick={() => window.open(iframeUrl, '_blank', 'noopener,noreferrer')}
                  size="small"
                  variant="ghost"
                >Открыть отдельно</Button>
              )}
            </div>
          </div>
          <div className={`live-session__device is-${state.viewport}`}>
            {iframeUrl && (
              <iframe
                key={iframeUrl}
                onLoad={onReady}
                src={iframeUrl}
                title="Интерактивное демо пользовательского пути"
              />
            )}
          </div>
        </>
      )}

      <LiveEventFeed events={events} />
    </section>
  )
}

export function LiveEventFeed({ events }: { events: OnboardingEventPayload[] }) {
  return (
      <div className="live-events">
        <div className="live-events__title">
          <h3>События</h3>
          <span>{events.length}</span>
        </div>
        {events.length === 0 ? (
          <p className="live-events__empty">События появятся после начала онбординга.</p>
        ) : (
          <ol aria-live="polite">
            {events.toReversed().map((event) => (
              <li key={event.eventKey}>
                {event.type === 'scenario_completed' ? (
                  <CheckCircle2 aria-hidden="true" size={16} />
                ) : (
                  <span className="live-events__dot" />
                )}
                <div>
                  <strong>{getEventLabel(event.type)}</strong>
                  <small>{event.pageUrl}{event.stepId ? ` · ${event.stepId}` : ''}</small>
                </div>
                <time>{new Date(event.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
              </li>
            ))}
          </ol>
        )}
      </div>
  )
}

function getStatusLabel(status: LiveSessionState['status']) {
  const labels = {
    idle: 'Готов',
    starting: 'Запускаем',
    running: 'В процессе',
    completed: 'Завершено',
    dismissed: 'Пропущено',
    error: 'Ошибка',
  }
  return labels[status]
}

function getEventLabel(type: string) {
  return {
    scenario_started: 'Сценарий начат',
    step_viewed: 'Подсказка показана',
    step_completed: 'Шаг завершён',
    scenario_completed: 'Страница завершена',
    scenario_dismissed: 'Онбординг пропущен',
    target_not_found: 'Элемент не найден',
  }[type] ?? type
}
