import { useMemo, useState } from 'react'
import type {
  OnboardingScenario,
  OnboardingStep,
  ScenarioStatus,
} from '@m2ie/onboarding-sdk'
import {
  Badge,
  Button,
  Dialog,
  IconButton,
  ResizablePanel,
  ResizableWorkspace,
  ResizeHandle,
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
  Trash2,
  Workflow,
} from 'lucide-react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import type { ScenarioValidation } from '../model/scenarioValidation'
import {
  isSameLogicalScenario,
  type ScenarioVersionGroup,
} from '../model/scenarioVersions'

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
  scenarioGroups: ScenarioVersionGroup[]
  activeScenario?: OnboardingScenario
  activeStep?: OnboardingStep
  readOnly?: boolean
  showExtendedFields?: boolean
  validation?: ScenarioValidation
  onAddStep: () => void
  onDeleteStep: () => void
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
  scenarioGroups,
  activeScenario,
  activeStep,
  readOnly = false,
  showExtendedFields = true,
  validation,
  onAddStep,
  onDeleteStep,
  onOpenDemo,
  onSelectScenario,
  onSelectStep,
  onUpdateScenarioMeta,
  onUpdateStep,
}: ScenarioEditorProps) {
  const isResizableDesktop = useMediaQuery('(min-width: 1351px)')

  if (!activeScenario) {
    return null
  }

  const registry = (
    <TabsContent
      className="scenario-registry"
      forceMount
      value="scenarios"
    >
      <ScenarioRegistry
        activeScenario={activeScenario}
        onSelectScenario={onSelectScenario}
        scenarioGroups={scenarioGroups}
      />
    </TabsContent>
  )
  const editor = (
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
        {activeStep ? (
          <StepForm
            activeStep={activeStep}
            readOnly={readOnly}
            showExtendedFields={showExtendedFields}
            onUpdateStep={onUpdateStep}
            onDeleteStep={onDeleteStep}
          />
        ) : (
          <EmptyStepEditor readOnly={readOnly} onAddStep={onAddStep} />
        )}
      </div>
    </TabsContent>
  )
  const preview = (
    <TabsContent
      className="scenario-preview-surface"
      forceMount
      value="preview"
    >
      {activeStep ? (
        <ScenarioPreview
          activeStep={activeStep}
          status={activeScenario.status}
          onOpenDemo={onOpenDemo}
        />
      ) : (
        <EmptyStepEditor readOnly={readOnly} onAddStep={onAddStep} />
      )}
    </TabsContent>
  )

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

      {isResizableDesktop ? (
        <ResizableWorkspace
          className="scenario-workspace"
          panelIds={['scenario-registry', 'scenario-editor', 'scenario-preview']}
          storageKey="scenario-editor"
        >
          <ResizablePanel
            defaultSize="18%"
            groupResizeBehavior="preserve-pixel-size"
            id="scenario-registry"
            maxSize={420}
            minSize={240}
          >
            {registry}
          </ResizablePanel>
          <ResizeHandle
            id="scenario-registry-handle"
            label="Изменить ширину списка сценариев"
          />
          <ResizablePanel
            defaultSize="58%"
            id="scenario-editor"
            minSize={520}
          >
            {editor}
          </ResizablePanel>
          <ResizeHandle
            id="scenario-preview-handle"
            label="Изменить ширину предпросмотра"
          />
          <ResizablePanel
            defaultSize="24%"
            groupResizeBehavior="preserve-pixel-size"
            id="scenario-preview"
            maxSize={520}
            minSize={300}
          >
            {preview}
          </ResizablePanel>
        </ResizableWorkspace>
      ) : (
        <div className="scenario-workspace">
          {registry}
          {editor}
          {preview}
        </div>
      )}
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
  scenarioGroups: ScenarioVersionGroup[]
  activeScenario: OnboardingScenario
  onSelectScenario: (scenarioId: string) => void
}

function ScenarioRegistry({
  scenarioGroups,
  activeScenario,
  onSelectScenario,
}: ScenarioRegistryProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<ScenarioStatusFilter>('active')
  const normalizedQuery = query.trim().toLocaleLowerCase('ru')
  const filteredScenarios = useMemo(() => {
    return scenarioGroups.flatMap((group) => {
      const scenario =
        statusFilter === 'archived'
          ? group.archived[0]
          : statusFilter === 'active'
            ? group.draft ?? group.published
            : group.primary
      const matchesQuery = [group.draft, group.published, ...group.archived]
        .filter((item): item is OnboardingScenario => Boolean(item))
        .some((item) =>
          `${item.name} ${item.url}`
            .toLocaleLowerCase('ru')
            .includes(normalizedQuery),
        )

      return scenario && matchesQuery ? [{ group, scenario }] : []
    })
  }, [normalizedQuery, scenarioGroups, statusFilter])

  return (
    <section className="scenario-registry__inner">
      <div className="workspace-section-header">
        <div>
          <h2>Сценарии</h2>
          <span>{formatScenarioCount(filteredScenarios.length)}</span>
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
        {filteredScenarios.map(({ group, scenario }) => (
          <button
            className={
              isSameLogicalScenario(scenario, activeScenario)
                ? 'is-active'
                : undefined
            }
            key={group.key}
            onClick={() => onSelectScenario(scenario.id)}
            type="button"
          >
            <span className="scenario-list__icon" aria-hidden="true">
              <FileText size={17} strokeWidth={2} />
            </span>
            <span className="scenario-list__content">
              <strong>{scenario.name}</strong>
              <small>{scenario.url}</small>
              <span className="scenario-statuses">
                {statusFilter === 'archived' ? (
                  <ScenarioStatusBadge status="archived" />
                ) : (
                  <>
                    {group.published && (
                      <ScenarioStatusBadge status="published" />
                    )}
                    {group.draft && <ScenarioStatusBadge status="draft" />}
                    {!group.draft && !group.published && (
                      <ScenarioStatusBadge status="archived" />
                    )}
                  </>
                )}
                {statusFilter === 'archived' && group.archived.length > 1 && (
                  <small>{group.archived.length} версий</small>
                )}
              </span>
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
        <label>
          <span>Пользовательский путь</span>
          <input
            disabled
            value={(scenario.flowName ?? scenario.flowKey) || 'Не добавлен в путь'}
          />
        </label>
        <label>
          <span>Позиция в пути</span>
          <input
            disabled
            value={scenario.flowOrder > 0 ? String(scenario.flowOrder) : '—'}
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
  activeStep?: OnboardingStep
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
            className={step.id === activeStep?.id ? 'is-active' : undefined}
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

function EmptyStepEditor({
  readOnly,
  onAddStep,
}: {
  readOnly: boolean
  onAddStep: () => void
}) {
  return (
    <section className="editor-state editor-state--embedded">
      <h2>В сценарии пока нет шагов</h2>
      <p>Добавьте первую подсказку и укажите элемент страницы.</p>
      <Button disabled={readOnly} onClick={onAddStep}>
        Добавить шаг
      </Button>
    </section>
  )
}

type StepFormProps = {
  activeStep: OnboardingStep
  readOnly: boolean
  showExtendedFields: boolean
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
  onDeleteStep: () => void
}

function StepForm({
  activeStep,
  readOnly,
  showExtendedFields,
  onUpdateStep,
  onDeleteStep,
}: StepFormProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <section className="step-inspector">
      <div className="workspace-section-header workspace-section-header--compact">
        <div>
          <h2>Инспектор шага</h2>
          <span>Шаг {activeStep.order}</span>
        </div>
        <IconButton
          disabled={readOnly}
          icon={<Trash2 aria-hidden="true" size={17} />}
          label="Удалить шаг"
          onClick={() => setDeleteDialogOpen(true)}
          variant="danger"
        />
      </div>

      <Dialog
        description="Подсказка будет удалена из черновика. Остальные шаги автоматически перенумеруются."
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title={`Удалить шаг ${activeStep.order}?`}
      >
        <div className="scenario-delete-dialog__actions">
          <Button onClick={() => setDeleteDialogOpen(false)} variant="ghost">
            Отмена
          </Button>
          <Button
            icon={<Trash2 aria-hidden="true" size={17} />}
            onClick={() => {
              setDeleteDialogOpen(false)
              onDeleteStep()
            }}
            variant="danger"
          >
            Удалить шаг
          </Button>
        </div>
      </Dialog>

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

function formatScenarioCount(count: number) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} сценариев`
  }
  if (lastDigit === 1) return `${count} сценарий`
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} сценария`
  return `${count} сценариев`
}
