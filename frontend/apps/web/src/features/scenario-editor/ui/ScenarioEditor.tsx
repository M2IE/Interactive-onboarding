import { useMemo, useState } from 'react'
import type {
  OnboardingScenario,
  OnboardingStep,
} from '@interactive-onboarding/shared'
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
import type { ScenarioEditorWorkflow } from '../model/scenarioEditorSlice'

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

type ScenarioEditorProps = {
  scenarios: OnboardingScenario[]
  activeScenario?: OnboardingScenario
  activeStep?: OnboardingStep
  workflow: ScenarioEditorWorkflow
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
  workflow,
  onAddStep,
  onOpenDemo,
  onSelectScenario,
  onSelectStep,
  onUpdateScenarioMeta,
  onUpdateStep,
}: ScenarioEditorProps) {
  if (!activeScenario || !activeStep) {
    return null
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
            onUpdateScenarioMeta={onUpdateScenarioMeta}
          />
          <div className="scenario-editor-body">
            <StepTimeline
              activeScenario={activeScenario}
              activeStep={activeStep}
              onAddStep={onAddStep}
              onSelectStep={onSelectStep}
            />
            <StepForm activeStep={activeStep} onUpdateStep={onUpdateStep} />
          </div>
        </TabsContent>

        <TabsContent
          className="scenario-preview-surface"
          forceMount
          value="preview"
        >
          <ScenarioPreview
            activeStep={activeStep}
            published={
              activeScenario.status === 'published' ||
              workflow.status === 'published'
            }
            onOpenDemo={onOpenDemo}
          />
        </TabsContent>
      </div>
    </Tabs>
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
  const normalizedQuery = query.trim().toLocaleLowerCase('ru')
  const filteredScenarios = useMemo(
    () =>
      scenarios.filter((scenario) =>
        `${scenario.name} ${scenario.url}`
          .toLocaleLowerCase('ru')
          .includes(normalizedQuery),
      ),
    [normalizedQuery, scenarios],
  )

  return (
    <section className="scenario-registry__inner">
      <div className="workspace-section-header">
        <div>
          <h2>Сценарии</h2>
          <span>{scenarios.length} точки входа</span>
        </div>
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
              <Badge
                className="scenario-status"
                dot
                tone={scenario.status === 'published' ? 'green' : 'gray'}
              >
                {scenario.status === 'published' ? 'Опубликован' : 'Черновик'}
              </Badge>
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
  onUpdateScenarioMeta: (patch: {
    name?: string
    description?: string
    url?: string
  }) => void
}

function ScenarioMetaForm({
  scenario,
  onUpdateScenarioMeta,
}: ScenarioMetaFormProps) {
  return (
    <section className="scenario-meta-section">
      <div className="workspace-section-header">
        <div>
          <h2>Настройки сценария</h2>
          <span>Основные данные точки входа</span>
        </div>
        <Badge dot tone={scenario.status === 'published' ? 'green' : 'gray'}>
          {scenario.status === 'published' ? 'Опубликован' : 'Черновик'}
        </Badge>
      </div>

      <div className="scenario-meta">
        <label>
          <span>Название сценария</span>
          <input
            value={scenario.name}
            onChange={(event) =>
              onUpdateScenarioMeta({ name: event.target.value })
            }
          />
        </label>
        <label>
          <span>Путь страницы</span>
          <input
            placeholder="/demo/new/auto"
            value={scenario.url}
            onChange={(event) =>
              onUpdateScenarioMeta({ url: event.target.value })
            }
          />
        </label>
        <label className="scenario-meta__description">
          <span>Описание</span>
          <textarea
            value={scenario.description}
            onChange={(event) =>
              onUpdateScenarioMeta({ description: event.target.value })
            }
          />
        </label>
      </div>
    </section>
  )
}

type StepTimelineProps = {
  activeScenario: OnboardingScenario
  activeStep: OnboardingStep
  onAddStep: () => void
  onSelectStep: (stepId: string) => void
}

function StepTimeline({
  activeScenario,
  activeStep,
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
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
}

function StepForm({ activeStep, onUpdateStep }: StepFormProps) {
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
            value={activeStep.title}
            onChange={(event) => onUpdateStep({ title: event.target.value })}
          />
        </label>
        <label>
          <span>Текст подсказки</span>
          <textarea
            value={activeStep.body}
            onChange={(event) => onUpdateStep({ body: event.target.value })}
          />
        </label>
        <label>
          <span>Селектор элемента</span>
          <input
            value={activeStep.selector}
            onChange={(event) => onUpdateStep({ selector: event.target.value })}
          />
        </label>
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
        <label>
          <span>URL перехода</span>
          <input
            placeholder="Опционально"
            value={activeStep.nextUrl ?? ''}
            onChange={(event) =>
              onUpdateStep({ nextUrl: event.target.value || undefined })
            }
          />
        </label>
        <label>
          <span>Условие показа</span>
          <input
            placeholder="Например: firstListing=true"
            value={activeStep.condition ?? ''}
            onChange={(event) =>
              onUpdateStep({ condition: event.target.value || undefined })
            }
          />
        </label>
      </div>
    </section>
  )
}

type ScenarioPreviewProps = {
  activeStep: OnboardingStep
  published: boolean
  onOpenDemo: () => void
}

function ScenarioPreview({
  activeStep,
  published,
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
        <Badge tone={published ? 'green' : 'blue'} dot>
          {published
            ? 'Конфигурация опубликована'
            : 'Предпросмотр черновика'}
        </Badge>
        <Button
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
