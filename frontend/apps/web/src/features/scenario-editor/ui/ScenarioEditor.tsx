import { useMemo, useState } from 'react'
import type {
  OnboardingScenario,
  OnboardingStep,
  ScenarioStatus,
} from '@m2ie/onboarding-sdk'
import {
  Badge,
  Button,
  IconButton,
  SelectField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@interactive-onboarding/ui'
import {
  ExternalLink,
  FileText,
  GripVertical,
  ListTree,
  Monitor,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Workflow,
} from 'lucide-react'
import type { ScenarioValidation } from '../model/scenarioValidation'

const placementOptions: Array<{
  label: string
  value: OnboardingStep['placement']
}> = [
  { label: 'Справа', value: 'right' },
  { label: 'Слева', value: 'left' },
  { label: 'Сверху', value: 'top' },
  { label: 'Снизу', value: 'bottom' },
]

const completionOptions: Array<{
  label: string
  value: OnboardingStep['completion']
}> = [
  { label: 'Кнопка далее', value: 'next_button' },
  { label: 'Клик по элементу', value: 'target_click' },
  { label: 'Переход', value: 'navigate' },
]

type ScenarioStatusFilter = 'active' | 'archived' | 'all'

const scenarioStatusPresentation: Record<
  ScenarioStatus,
  { label: string; tone: 'blue' | 'green' | 'gray' }
> = {
  draft: { label: 'Черновик', tone: 'blue' },
  published: { label: 'Опубликован', tone: 'green' },
  archived: { label: 'Архивный', tone: 'gray' },
}

type ScenarioEditorProps = {
  scenarios: OnboardingScenario[]
  activeScenario?: OnboardingScenario
  activeStep?: OnboardingStep
  readOnly?: boolean
  showExtendedFields?: boolean
  validation?: ScenarioValidation
  onAddStep: () => void
  onOpenDemo: () => void
  onSelectScenario: (scenarioId: string) => void
  onSelectStep: (stepId: string) => void
  onUpdateScenarioMeta: (patch: {
    name?: string
    description?: string
    url?: string
  }) => void
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
}

export function ScenarioEditor({
  scenarios,
  activeScenario,
  activeStep,
  readOnly = false,
  showExtendedFields = true,
  validation,
  onAddStep,
  onOpenDemo,
  onSelectScenario,
  onSelectStep,
  onUpdateScenarioMeta,
  onUpdateStep,
}: ScenarioEditorProps) {
  if (!activeScenario) {
    return null
  }

  if (!activeStep) {
    return (
      <section className="editor-state">
        <h2>В сценарии пока нет шагов</h2>
        <p>Добавьте первую подсказку и укажите элемент страницы.</p>
        <Button disabled={readOnly} onClick={onAddStep}>
          Добавить шаг
        </Button>
      </section>
    )
  }

  return (
    <Tabs className="scenario-tabs" defaultValue="editor">
      <TabsList aria-label="Разделы редактора" className="scenario-mobile-tabs">
        <TabsTrigger value="scenarios">
          <ListTree aria-hidden="true" size={18} />
          Сценарии
        </TabsTrigger>
        <TabsTrigger value="editor">
          <Workflow aria-hidden="true" size={18} />
          Шаги
        </TabsTrigger>
        <TabsTrigger value="preview">
          <Monitor aria-hidden="true" size={18} />
          Предпросмотр
        </TabsTrigger>
      </TabsList>

      <div className="scenario-workspace">
        <TabsContent
          className="scenario-registry"
          forceMount
          value="scenarios"
        >
          <ScenarioRegistry
            activeScenario={activeScenario}
            onSelectScenario={onSelectScenario}
            scenarios={scenarios}
          />
        </TabsContent>

        <TabsContent
          className="scenario-editor-surface"
          forceMount
          value="editor"
        >
          <ScenarioMetaForm
            scenario={activeScenario}
            readOnly={readOnly}
            showExtendedFields={showExtendedFields}
            onUpdateScenarioMeta={onUpdateScenarioMeta}
          />
          {validation && <ScenarioValidationPanel validation={validation} />}
          <div className="scenario-editor-body">
            <StepTimeline
              activeScenario={activeScenario}
              activeStep={activeStep}
              readOnly={readOnly}
              onAddStep={onAddStep}
              onSelectStep={onSelectStep}
            />
            <StepForm
              activeStep={activeStep}
              readOnly={readOnly}
              showExtendedFields={showExtendedFields}
              onUpdateStep={onUpdateStep}
            />
          </div>
        </TabsContent>

        <TabsContent
          className="scenario-preview-surface"
          forceMount
          value="preview"
        >
          <ScenarioPreview
            activeStep={activeStep}
            status={activeScenario.status}
            onOpenDemo={onOpenDemo}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}

function ScenarioValidationPanel({
  validation,
}: {
  validation: ScenarioValidation
}) {
  if (validation.issues.length === 0) {
    return (
      <aside className="scenario-validation scenario-validation--valid">
        <strong>Готово к публикации</strong>
        <span>Обязательные поля заполнены.</span>
      </aside>
    )
  }

  return (
    <aside
      className={`scenario-validation scenario-validation--${validation.status}`}
      role={validation.status === 'invalid' ? 'alert' : 'status'}
    >
      <strong>
        {validation.status === 'invalid'
          ? 'Проверьте сценарий перед публикацией'
          : 'Сценарий можно улучшить'}
      </strong>
      <ul>
        {validation.issues.map((issue, index) => (
          <li key={`${issue.code}-${issue.stepId ?? 'scenario'}-${index}`}>
            {issue.message}
          </li>
        ))}
      </ul>
    </aside>
  )
}

type ScenarioRegistryProps = {
  scenarios: OnboardingScenario[]
  activeScenario: OnboardingScenario
  onSelectScenario: (scenarioId: string) => void
}

function ScenarioRegistry({
  scenarios,
  activeScenario,
  onSelectScenario,
}: ScenarioRegistryProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<ScenarioStatusFilter>('active')
  const normalizedQuery = query.trim().toLocaleLowerCase('ru')
  const filteredScenarios = useMemo(
    () =>
      scenarios.filter((scenario) => {
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'archived'
            ? scenario.status === 'archived'
            : scenario.status !== 'archived')
        const matchesQuery = `${scenario.name} ${scenario.url}`
          .toLocaleLowerCase('ru')
          .includes(normalizedQuery)

        return matchesStatus && matchesQuery
      }),
    [normalizedQuery, scenarios, statusFilter],
  )

  return (
    <section className="scenario-registry__inner">
      <div className="workspace-section-header">
        <div>
          <h2>Сценарии</h2>
          <span>{filteredScenarios.length} сценариев</span>
        </div>
      </div>

      <div
        aria-label="Фильтр сценариев"
        className="scenario-status-filter"
        role="group"
      >
        <button
          aria-pressed={statusFilter === 'active'}
          onClick={() => setStatusFilter('active')}
          type="button"
        >
          Активные
        </button>
        <button
          aria-pressed={statusFilter === 'archived'}
          onClick={() => setStatusFilter('archived')}
          type="button"
        >
          Архив
        </button>
        <button
          aria-pressed={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
          type="button"
        >
          Все
        </button>
      </div>

      <label className="scenario-search">
        <span className="visually-hidden">Поиск сценариев</span>
        <Search aria-hidden="true" size={17} />
        <input
          placeholder="Поиск сценариев"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="scenario-list">
        {filteredScenarios.map((scenario) => (
          <button
            className={scenario.id === activeScenario.id ? 'is-active' : undefined}
            key={scenario.id}
            onClick={() => onSelectScenario(scenario.id)}
            type="button"
          >
            <span className="scenario-list__icon" aria-hidden="true">
              <FileText size={17} strokeWidth={2} />
            </span>
            <span className="scenario-list__content">
              <strong>{scenario.name}</strong>
              <small>{scenario.url}</small>
              <ScenarioStatusBadge
                className="scenario-status"
                status={scenario.status}
              />
            </span>
          </button>
        ))}
      </div>

      {filteredScenarios.length === 0 && (
        <p className="scenario-list-empty">Сценарии не найдены</p>
      )}
    </section>
  )
}

type ScenarioMetaFormProps = {
  scenario: OnboardingScenario
  readOnly: boolean
  showExtendedFields: boolean
  onUpdateScenarioMeta: (patch: {
    name?: string
    description?: string
    url?: string
  }) => void
}

function ScenarioMetaForm({
  scenario,
  readOnly,
  showExtendedFields,
  onUpdateScenarioMeta,
}: ScenarioMetaFormProps) {
  return (
    <section className="scenario-meta-section">
      <div className="workspace-section-header">
        <div>
          <h2>Настройки сценария</h2>
          <span>Основные данные точки входа</span>
        </div>
        <ScenarioStatusBadge status={scenario.status} />
      </div>

      <div className="scenario-meta">
        <label>
          <span>Название сценария</span>
          <input
            disabled={readOnly}
            value={scenario.name}
            onChange={(event) =>
              onUpdateScenarioMeta({ name: event.target.value })
            }
          />
        </label>
        <label>
          <span>Путь страницы</span>
          <input
            disabled={readOnly}
            placeholder="/demo/new/auto"
            value={scenario.url}
            onChange={(event) =>
              onUpdateScenarioMeta({ url: event.target.value })
            }
          />
        </label>
        {showExtendedFields && (
          <label className="scenario-meta__description">
            <span>Описание</span>
            <textarea
              disabled={readOnly}
              value={scenario.description}
              onChange={(event) =>
                onUpdateScenarioMeta({ description: event.target.value })
              }
            />
          </label>
        )}
      </div>
    </section>
  )
}

type StepTimelineProps = {
  activeScenario: OnboardingScenario
  activeStep: OnboardingStep
  readOnly: boolean
  onAddStep: () => void
  onSelectStep: (stepId: string) => void
}

function StepTimeline({
  activeScenario,
  activeStep,
  readOnly,
  onAddStep,
  onSelectStep,
}: StepTimelineProps) {
  const orderedSteps = activeScenario.steps.toSorted(
    (left, right) => left.order - right.order,
  )

  return (
    <section className="steps-timeline-section">
      <div className="workspace-section-header workspace-section-header--compact">
        <div>
          <h2>Шаги сценария</h2>
          <span>{orderedSteps.length} подсказок</span>
        </div>
        <IconButton
          icon={<Plus aria-hidden="true" size={18} />}
          label="Добавить шаг"
          disabled={readOnly}
          onClick={onAddStep}
          variant="secondary"
        />
      </div>

      <div className="steps-timeline">
        {orderedSteps.map((step) => (
          <button
            className={step.id === activeStep.id ? 'is-active' : undefined}
            key={step.id}
            onClick={() => onSelectStep(step.id)}
            type="button"
          >
            <GripVertical
              aria-hidden="true"
              className="step-drag-icon"
              size={16}
            />
            <strong>{step.order}</strong>
            <span>{step.title}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

type StepFormProps = {
  activeStep: OnboardingStep
  readOnly: boolean
  showExtendedFields: boolean
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
}

function StepForm({
  activeStep,
  readOnly,
  showExtendedFields,
  onUpdateStep,
}: StepFormProps) {
  return (
    <section className="step-inspector">
      <div className="workspace-section-header workspace-section-header--compact">
        <div>
          <h2>Инспектор шага</h2>
          <span>Шаг {activeStep.order}</span>
        </div>
      </div>

      <div className="step-form">
        <label>
          <span>Заголовок подсказки</span>
          <input
            disabled={readOnly}
            value={activeStep.title}
            onChange={(event) => onUpdateStep({ title: event.target.value })}
          />
        </label>
        <label>
          <span>Текст подсказки</span>
          <textarea
            disabled={readOnly}
            value={activeStep.body}
            onChange={(event) => onUpdateStep({ body: event.target.value })}
          />
        </label>
        <label>
          <span>Селектор элемента</span>
          <input
            disabled={readOnly}
            value={activeStep.selector}
            onChange={(event) => onUpdateStep({ selector: event.target.value })}
          />
        </label>
        {showExtendedFields && (
          <div className="form-grid">
            <SelectField
              label="Позиция подсказки"
              options={placementOptions}
              value={activeStep.placement}
              onValueChange={(placement) => onUpdateStep({ placement })}
            />
            <SelectField
              label="Завершение шага"
              options={completionOptions}
              value={activeStep.completion}
              onValueChange={(completion) => onUpdateStep({ completion })}
            />
          </div>
        )}
        <label>
          <span>URL перехода</span>
          <input
            disabled={readOnly}
            placeholder="Опционально"
            value={activeStep.nextUrl ?? ''}
            onChange={(event) =>
              onUpdateStep({ nextUrl: event.target.value || undefined })
            }
          />
        </label>
        {showExtendedFields && (
          <>
            <label>
              <span>Условие показа</span>
              <input
                disabled={readOnly}
                placeholder="Например: firstListing=true"
                value={activeStep.condition ?? ''}
                onChange={(event) =>
                  onUpdateStep({ condition: event.target.value || undefined })
                }
              />
            </label>
          </>
        )}
      </div>
    </section>
  )
}

type ScenarioPreviewProps = {
  activeStep: OnboardingStep
  status: ScenarioStatus
  onOpenDemo: () => void
}

function ScenarioPreview({
  activeStep,
  status,
  onOpenDemo,
}: ScenarioPreviewProps) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    'desktop',
  )

  return (
    <section className="scenario-preview">
      <div className="workspace-section-header">
        <div>
          <h2>Предпросмотр</h2>
          <span>Конфигурация SDK</span>
        </div>
        <Tabs
          className="preview-device-tabs"
          value={previewDevice}
          onValueChange={(value) =>
            setPreviewDevice(value as 'desktop' | 'mobile')
          }
        >
          <TabsList aria-label="Размер предпросмотра">
            <TabsTrigger aria-label="Desktop" value="desktop">
              <Monitor aria-hidden="true" size={17} />
            </TabsTrigger>
            <TabsTrigger aria-label="Mobile" value="mobile">
              <Smartphone aria-hidden="true" size={17} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={`preview-stage preview-stage--${previewDevice}`}>
        <div className="preview-stage__chrome">
          <span />
          <span />
          <span />
          <small>demo.classified.local</small>
        </div>
        <div className="preview-stage__content">
          <div className="preview-stage__skeleton">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="preview-target">Целевой элемент</div>
          <article className="preview-tooltip-card">
            <div>
              <Sparkles aria-hidden="true" size={16} />
              <span>Шаг {activeStep.order}</span>
            </div>
            <h3>{activeStep.title}</h3>
            <p>{activeStep.body}</p>
            <div className="preview-tooltip-card__actions">
              <span>Пропустить</span>
              <strong>Далее</strong>
            </div>
          </article>
        </div>
      </div>

      <div className="preview-footer">
        <Badge tone={scenarioStatusPresentation[status].tone} dot>
          {status === 'published'
            ? 'Конфигурация опубликована'
            : status === 'archived'
              ? 'Архивная версия'
              : 'Предпросмотр черновика'}
        </Badge>
        <Button
          disabled={status === 'archived'}
          icon={<ExternalLink aria-hidden="true" size={17} />}
          onClick={onOpenDemo}
          variant="primary"
        >
          Открыть демо
        </Button>
      </div>
    </section>
  )
}

function ScenarioStatusBadge({
  status,
  className,
}: {
  status: ScenarioStatus
  className?: string
}) {
  const presentation = scenarioStatusPresentation[status]

  return (
    <Badge className={className} dot tone={presentation.tone}>
      {presentation.label}
    </Badge>
  )
}
