import { useState, type ReactNode } from 'react'
import { Badge, Button, IconButton } from '@interactive-onboarding/ui'
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  LocateFixed,
  MousePointer2,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import type { StepDraft } from '../../../entities/draft/model/types'
import type { WorkspaceState } from '../model/types'
import { useExtensionScenarioEditor } from '../hooks/useExtensionScenarioEditor'

export type ExtensionScenarioEditorController = ReturnType<
  typeof useExtensionScenarioEditor
>

type ExtensionScenarioEditorProps = {
  controller: ExtensionScenarioEditorController
}

export function ExtensionScenarioEditor({
  controller,
}: ExtensionScenarioEditorProps) {
  const { state } = controller

  switch (state.status) {
    case 'booting':
      return (
        <CenteredState title="Подключаемся к странице">
          Определяем активную вкладку и загружаем настройки.
        </CenteredState>
      )
    case 'unsupported':
      return (
        <CenteredState icon={<CircleAlert size={24} />} title="Страница недоступна">
          {state.message}
        </CenteredState>
      )
    case 'loading':
      return (
        <CenteredState title="Загружаем сценарий">
          Ищем черновик для текущей страницы.
        </CenteredState>
      )
    case 'error':
      return (
        <CenteredState icon={<CircleAlert size={24} />} title="Не удалось загрузить данные">
          <p>{state.message}</p>
          {state.settings && state.context && (
            <Button onClick={controller.retry}>Повторить</Button>
          )}
        </CenteredState>
      )
    case 'setup':
      return (
        <SettingsForm
          error={state.error}
          form={state.form}
          showCancel={Boolean(state.previousSettings)}
          onCancel={controller.cancelSettings}
          onChange={controller.updateSettingsForm}
          onSubmit={() => void controller.saveSettings()}
        />
      )
    case 'empty':
      return (
        <EmptyPageState
          hasPublishedScenario={state.hasPublishedScenario}
          pathname={state.context.pathname}
          onCreate={controller.createDraft}
          onOpenSettings={controller.openSettings}
        />
      )
    case 'ready':
      return <ReadyEditor controller={controller} />
  }
}

function ReadyEditor({ controller }: ExtensionScenarioEditorProps) {
  const { state, selectedStep } = controller

  if (state.status !== 'ready') {
    return null
  }

  const isCurrentPage = state.context.pathname === state.draft.url
  const isPicking = state.interaction.status === 'picking'
  const isPreviewing = state.interaction.status === 'previewing'
  const isWaiting = state.interaction.status === 'waiting_navigation'
  const isSaving = state.save.status === 'saving'

  return (
    <div
      className={`extension-editor${
        isPicking || isWaiting || isPreviewing
          ? ' extension-editor--has-interaction'
          : ''
      }`}
    >
      <header className="extension-toolbar">
        <div className="extension-brand" aria-label="Onboarding Studio">
          <span className="extension-brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <div>
            <strong>Onboarding Studio</strong>
            <small>{state.context.origin}</small>
          </div>
        </div>
        <div className="extension-toolbar__actions">
          <RequirementsGuideButton />
          <IconButton
            icon={<Settings aria-hidden="true" size={18} />}
            label="Настройки подключения"
            onClick={controller.openSettings}
          />
        </div>
      </header>

      <div className="page-context-bar">
        <span>Адрес страницы</span>
        <code>{state.context.pathname}</code>
        <Badge tone={isCurrentPage ? 'green' : 'red'} dot>
          {isCurrentPage ? 'Совпадает' : 'Другой путь'}
        </Badge>
      </div>

      {state.routeChange && (
        <Notice tone="warning">
          <div>
            <strong>Страница изменилась</strong>
            <p>
              Вы перешли с <code>{state.draft.url}</code> на{' '}
              <code>{state.routeChange.pathname}</code>. Открыть сценарий этой
              страницы?
            </p>
          </div>
          <div className="notice-actions">
            <Button size="small" onClick={controller.keepCurrentDraft}>
              Остаться
            </Button>
            <Button
              size="small"
              variant="primary"
              onClick={controller.switchToChangedPage}
            >
              Переключиться
            </Button>
          </div>
        </Notice>
      )}

      {state.hasPublishedScenario && (
        <Notice tone="info">
          На этой странице уже есть опубликованная версия. Расширение изменяет
          только отдельный черновик.
        </Notice>
      )}

      {state.runtimeNotice && <Notice tone="warning">{state.runtimeNotice}</Notice>}

      {(isPicking || isWaiting || isPreviewing) && (
        <InteractionBar
          interaction={state.interaction}
          onStop={controller.stopInteraction}
        />
      )}

      <section className="extension-section scenario-heading-section">
        <label className="extension-field">
          <span>Название сценария</span>
          <input
            value={state.draft.name}
            onChange={(event) =>
              controller.updateScenarioName(event.target.value)
            }
          />
        </label>
      </section>

      <section className="extension-section steps-section">
        <div className="extension-section__header">
          <div>
            <h2>Шаги</h2>
            <small>{state.draft.steps.length} на этой странице</small>
          </div>
          <IconButton
            disabled={!isCurrentPage || isPicking}
            icon={<Plus aria-hidden="true" size={18} />}
            label="Добавить шаг на этой странице"
            onClick={controller.addStep}
            variant="secondary"
          />
        </div>

        {state.draft.steps.length === 0 ? (
          <button
            className="steps-empty-action"
            disabled={!isCurrentPage}
            onClick={controller.addStep}
            type="button"
          >
            <MousePointer2 aria-hidden="true" size={21} />
            <span>
              <strong>Выбрать первый элемент</strong>
              <small>Наведите курсор на сайт и нажмите нужный элемент</small>
            </span>
          </button>
        ) : (
          <div className="extension-step-list">
            {state.draft.steps
              .toSorted((left, right) => left.order - right.order)
              .map((step) => (
                <button
                  className={
                    step.id === state.selectedStepId ? 'is-active' : undefined
                  }
                  key={step.id}
                  onClick={() => controller.selectStep(step.id)}
                  type="button"
                >
                  <strong>{step.order}</strong>
                  <span>
                    <b>{step.title || 'Без названия'}</b>
                    <small>{step.selector}</small>
                  </span>
                  {!step.persisted && <i>new</i>}
                  <ChevronRight aria-hidden="true" size={16} />
                </button>
              ))}
          </div>
        )}
      </section>

      {selectedStep && (
        <StepInspector
          canInteract={isCurrentPage && !isPicking}
          step={selectedStep}
          onDelete={controller.deleteStep}
          onMoveDown={() => controller.moveStep(1)}
          onMoveUp={() => controller.moveStep(-1)}
          onRetarget={controller.retargetStep}
          onUpdate={controller.updateStep}
        />
      )}

      <section className="extension-section continuation-section">
        <div className="extension-section__header">
          <div>
            <h2>Продолжение</h2>
            <small>Добавьте шаг здесь или свяжите следующую страницу</small>
          </div>
        </div>
        <div className="continuation-actions">
          <Button
            disabled={!isCurrentPage || isPicking}
            icon={<Plus aria-hidden="true" size={17} />}
            onClick={controller.addStep}
          >
            На этой странице
          </Button>
          <Button
            disabled={!selectedStep || !isCurrentPage || isPicking}
            icon={<ArrowLeftRight aria-hidden="true" size={17} />}
            onClick={controller.waitForNextPage}
          >
            На следующей странице
          </Button>
        </div>
      </section>

      <section className="extension-section preview-section">
        <div className="extension-section__header">
          <div>
            <h2>Предпросмотр</h2>
            <small>Аналитика не отправляется</small>
          </div>
        </div>
        <div className="preview-actions">
          <Button
            disabled={!selectedStep || !isCurrentPage || isPreviewing}
            icon={<Eye aria-hidden="true" size={17} />}
            onClick={controller.previewStep}
          >
            Этот шаг
          </Button>
          <Button
            disabled={state.draft.steps.length === 0 || !isCurrentPage || isPreviewing}
            icon={<Eye aria-hidden="true" size={17} />}
            onClick={controller.previewScenario}
          >
            Все шаги
          </Button>
        </div>
      </section>

      <footer className="extension-footer">
        <SaveStatus state={state.save} />
        <div>
          <IconButton
            disabled={!state.draft.id}
            icon={<ExternalLink aria-hidden="true" size={18} />}
            label="Открыть в админке"
            onClick={controller.openAdmin}
            variant="secondary"
          />
          <Button
            disabled={isSaving || state.draft.steps.length === 0}
            icon={<Save aria-hidden="true" size={17} />}
            onClick={() => void controller.saveDraft()}
            variant="primary"
          >
            {isSaving ? 'Сохраняем' : 'Сохранить'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

function StepInspector({
  canInteract,
  step,
  onDelete,
  onMoveDown,
  onMoveUp,
  onRetarget,
  onUpdate,
}: {
  canInteract: boolean
  step: StepDraft
  onDelete: () => void
  onMoveDown: () => void
  onMoveUp: () => void
  onRetarget: () => void
  onUpdate: (patch: Partial<StepDraft>) => void
}) {
  const hasStableMarker =
    step.selector.startsWith('[data-onboarding-id=') &&
    step.target?.matchCount === 1

  return (
    <section className="extension-section inspector-section">
      <div className="extension-section__header">
        <div>
          <h2>Инспектор шага</h2>
          <small>Шаг {step.order}</small>
        </div>
        <div className="inspector-order-actions">
          <IconButton
            icon={<ArrowUp aria-hidden="true" size={16} />}
            label="Поднять шаг"
            onClick={onMoveUp}
          />
          <IconButton
            icon={<ArrowDown aria-hidden="true" size={16} />}
            label="Опустить шаг"
            onClick={onMoveDown}
          />
          <IconButton
            icon={<Trash2 aria-hidden="true" size={16} />}
            label="Удалить шаг"
            onClick={onDelete}
            variant="danger"
          />
        </div>
      </div>

      <div className="inspector-fields">
        <label className="extension-field">
          <span>Заголовок</span>
          <input
            value={step.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
          />
        </label>
        <label className="extension-field">
          <span>Текст</span>
          <textarea
            rows={4}
            value={step.body}
            onChange={(event) => onUpdate({ body: event.target.value })}
          />
        </label>
        <label className="extension-field">
          <span>Выбранный элемент</span>
          <div className="selector-field-row">
            <input
              value={step.selector}
              onChange={(event) => onUpdate({ selector: event.target.value })}
            />
            <IconButton
              disabled={!canInteract}
              icon={<LocateFixed aria-hidden="true" size={17} />}
              label="Выбрать элемент заново"
              onClick={onRetarget}
              variant="secondary"
            />
          </div>
        </label>
        {step.target && (
          <div className="selector-confidence">
            <Badge
              tone={hasStableMarker ? 'green' : 'gray'}
              dot
            >
              {hasStableMarker ? 'Готов к публикации' : 'Требует проверки'}
            </Badge>
            {step.target.warnings.map((warning) => (
              <small key={warning}>{warning}</small>
            ))}
          </div>
        )}
        <label className="extension-field">
          <span>Куда перейти после шага</span>
          <input
            placeholder="Необязательно, например /catalog/item"
            value={step.nextUrl ?? ''}
            onChange={(event) =>
              onUpdate({ nextUrl: event.target.value || undefined })
            }
          />
        </label>
      </div>
    </section>
  )
}

function InteractionBar({
  interaction,
  onStop,
}: {
  interaction: Extract<
    WorkspaceState,
    { status: 'ready' }
  >['interaction']
  onStop: () => void
}) {
  const content =
    interaction.status === 'picking'
      ? {
          icon: <MousePointer2 size={18} />,
          title: 'Выберите элемент на странице',
          text: 'Оставайтесь в этой вкладке и нажмите нужный элемент на сайте. Esc отменяет выбор.',
        }
      : interaction.status === 'waiting_navigation'
        ? {
            icon: <ArrowLeftRight size={18} />,
            title: 'Перейдите на следующую страницу',
            text: 'Оставайтесь в этой вкладке и перейдите через интерфейс сайта. Расширение продолжит настройку автоматически.',
          }
        : {
            icon: <Eye size={18} />,
            title: 'Предпросмотр запущен',
            text: 'Подсказки видны только вам и не влияют на статистику.',
          }

  return (
    <div className="interaction-bar">
      <span>{content.icon}</span>
      <div>
        <strong>{content.title}</strong>
        <small>{content.text}</small>
      </div>
      <IconButton
        icon={<EyeOff aria-hidden="true" size={17} />}
        label="Остановить"
        onClick={onStop}
      />
    </div>
  )
}

function SaveStatus({
  state,
}: {
  state: Extract<WorkspaceState, { status: 'ready' }>['save']
}) {
  const content =
    state.status === 'error'
      ? { label: state.message, tone: 'red' as const }
      : state.status === 'dirty'
        ? { label: 'Есть несохранённые изменения', tone: 'gray' as const }
        : state.status === 'saving'
          ? { label: 'Сохраняем', tone: 'blue' as const }
          : state.status === 'saved'
            ? { label: 'Сохранено', tone: 'green' as const }
            : { label: 'Синхронизировано', tone: 'green' as const }

  return (
    <Badge tone={content.tone} dot>
      {content.label}
    </Badge>
  )
}

function SettingsForm({
  error,
  form,
  showCancel,
  onCancel,
  onChange,
  onSubmit,
}: {
  error?: string
  form: { platformUrl: string; projectKey: string }
  showCancel: boolean
  onCancel: () => void
  onChange: (patch: Partial<{ platformUrl: string; projectKey: string }>) => void
  onSubmit: () => void
}) {
  return (
    <div className="setup-screen">
      <div className="setup-brand">
        <div className="setup-brand__topline">
          <span className="extension-brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <RequirementsGuideButton />
        </div>
        <h1>Onboarding Studio</h1>
        <p>Подключите расширение к вашей платформе онбординга.</p>
      </div>
      <form
        className="setup-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className="extension-field">
          <span>URL платформы</span>
          <input
            placeholder="https://onboarding.example.com"
            required
            type="url"
            value={form.platformUrl}
            onChange={(event) => onChange({ platformUrl: event.target.value })}
          />
          <small>Расширение запросит доступ только к указанному сайту.</small>
        </label>
        <label className="extension-field">
          <span>Ключ проекта</span>
          <input
            placeholder="avito-demo"
            required
            value={form.projectKey}
            onChange={(event) => onChange({ projectKey: event.target.value })}
          />
        </label>
        {error && <p className="setup-error" role="alert">{error}</p>}
        <div className="setup-actions">
          {showCancel && <Button onClick={onCancel}>Отмена</Button>}
          <Button variant="primary" type="submit">
            Подключить
          </Button>
        </div>
      </form>
    </div>
  )
}

function EmptyPageState({
  hasPublishedScenario,
  pathname,
  onCreate,
  onOpenSettings,
}: {
  hasPublishedScenario: boolean
  pathname: string
  onCreate: () => void
  onOpenSettings: () => void
}) {
  return (
    <div className="empty-page-screen">
      <header className="extension-toolbar">
        <div className="extension-brand">
          <span className="extension-brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <strong>Onboarding Studio</strong>
        </div>
        <div className="extension-toolbar__actions">
          <RequirementsGuideButton />
          <IconButton
            icon={<Settings aria-hidden="true" size={18} />}
            label="Настройки подключения"
            onClick={onOpenSettings}
          />
        </div>
      </header>
      <div className="empty-page-content">
        <FileTargetIcon />
        <h1>Для страницы нет черновика</h1>
        <code>{pathname}</code>
        <p>
          Создайте сценарий для этой страницы. Он появится в админке после
          первого сохранения.
        </p>
        {hasPublishedScenario && (
          <Notice tone="info">
            Опубликованный сценарий останется без изменений.
          </Notice>
        )}
        <Button
          icon={<Plus aria-hidden="true" size={18} />}
          onClick={onCreate}
          variant="primary"
        >
          Создать черновик
        </Button>
      </div>
    </div>
  )
}

function RequirementsGuideButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <IconButton
        icon={<Info aria-hidden="true" size={18} />}
        label="Требования к странице"
        onClick={() => setIsOpen(true)}
        variant="secondary"
      />
      {isOpen && (
        <div
          className="requirements-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false)
            }
          }}
        >
          <section
            aria-labelledby="requirements-guide-title"
            aria-modal="true"
            className="requirements-dialog"
            role="dialog"
          >
            <header>
              <div>
                <span className="requirements-dialog__icon" aria-hidden="true">
                  <Info size={18} />
                </span>
                <div>
                  <h2 id="requirements-guide-title">Требования к странице</h2>
                  <p>Что нужно для надёжного онбординга</p>
                </div>
              </div>
              <IconButton
                icon={<X aria-hidden="true" size={18} />}
                label="Закрыть гайд"
                onClick={() => setIsOpen(false)}
              />
            </header>

            <div className="requirements-dialog__content">
              <div className="requirements-dialog__notice">
                Расширение гарантирует однозначный выбор только для уникального
                и стабильного <code>data-onboarding-id</code>.
              </div>

              <div>
                <h3>Разметьте целевой элемент</h3>
                <pre>{'<button data-onboarding-id="create-listing">\n  Разместить объявление\n</button>'}</pre>
              </div>

              <ul>
                <li>Значение уникально в пределах страницы.</li>
                <li>Атрибут не меняется между релизами и состояниями UI.</li>
                <li>В нём нет ID пользователя, телефона или других данных.</li>
                <li>Элемент существует к моменту показа подсказки.</li>
              </ul>

              <p className="requirements-dialog__disclaimer">
                Если атрибута нет, расширение попробует определить элемент другим
                способом и покажет предупреждение. Такой вариант подходит для
                прототипа, но может перестать работать после изменения страницы.
              </p>
            </div>

            <footer>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Понятно
              </Button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

function Notice({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'info' | 'warning'
}) {
  return <aside className={`extension-notice extension-notice--${tone}`}>{children}</aside>
}

function CenteredState({
  children,
  icon,
  title,
}: {
  children: ReactNode
  icon?: ReactNode
  title: string
}) {
  return (
    <main className="centered-state">
      {icon && <span>{icon}</span>}
      <h1>{title}</h1>
      <div>{children}</div>
    </main>
  )
}

function FileTargetIcon() {
  return (
    <span className="file-target-icon" aria-hidden="true">
      <LocateFixed size={24} />
      <Check size={14} />
    </span>
  )
}
