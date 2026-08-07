import type {
  OnboardingScenario,
  OnboardingStep,
} from '@interactive-onboarding/shared'
import { Badge, Button, Panel } from '@interactive-onboarding/ui'
import type { ScenarioEditorWorkflow } from '../model/scenarioEditorSlice'

type ScenarioEditorProps = {
  scenarios: OnboardingScenario[]
  activeScenario?: OnboardingScenario
  activeStep?: OnboardingStep
  workflow: ScenarioEditorWorkflow
  onAddStep: () => void
  onSelectScenario: (scenarioId: string) => void
  onSelectStep: (stepId: string) => void
  onUpdateScenarioMeta: (patch: { name?: string; description?: string }) => void
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
}

export function ScenarioEditor({
  scenarios,
  activeScenario,
  activeStep,
  workflow,
  onAddStep,
  onSelectScenario,
  onSelectStep,
  onUpdateScenarioMeta,
  onUpdateStep,
}: ScenarioEditorProps) {
  if (!activeScenario || !activeStep) {
    return null
  }

  return (
    <div className="admin-grid">
      <Panel title="Сценарии">
        <ScenarioList
          activeScenario={activeScenario}
          onSelectScenario={onSelectScenario}
          scenarios={scenarios}
        />
      </Panel>

      <Panel
        action={<Button onClick={onAddStep}>Добавить шаг</Button>}
        className="scenario-editor"
        title="Настройка шагов"
      >
        <ScenarioMetaForm
          scenario={activeScenario}
          onUpdateScenarioMeta={onUpdateScenarioMeta}
        />
        <StepLayout
          activeScenario={activeScenario}
          activeStep={activeStep}
          onSelectStep={onSelectStep}
          onUpdateStep={onUpdateStep}
        />
      </Panel>

      <Panel title="Проверка результата">
        <div className="preview-panel">
          <div>
            <Badge tone={workflow.status === 'published' ? 'green' : 'blue'}>
              SDK config
            </Badge>
            <h3>{activeStep.title}</h3>
            <p>{activeStep.body}</p>
            <small>{activeStep.selector}</small>
          </div>
          <a href="/demo/profile">
            <Button variant="primary">Открыть демо</Button>
          </a>
        </div>
      </Panel>
    </div>
  )
}

type ScenarioListProps = {
  scenarios: OnboardingScenario[]
  activeScenario: OnboardingScenario
  onSelectScenario: (scenarioId: string) => void
}

function ScenarioList({
  scenarios,
  activeScenario,
  onSelectScenario,
}: ScenarioListProps) {
  return (
    <div className="scenario-list">
      {scenarios.map((scenario) => (
        <button
          className={scenario.id === activeScenario.id ? 'is-active' : undefined}
          key={scenario.id}
          onClick={() => onSelectScenario(scenario.id)}
          type="button"
        >
          <span>{scenario.name}</span>
          <Badge tone={scenario.status === 'published' ? 'green' : 'gray'}>
            {scenario.status === 'published' ? 'Опубликован' : 'Черновик'}
          </Badge>
        </button>
      ))}
    </div>
  )
}

type ScenarioMetaFormProps = {
  scenario: OnboardingScenario
  onUpdateScenarioMeta: (patch: { name?: string; description?: string }) => void
}

function ScenarioMetaForm({
  scenario,
  onUpdateScenarioMeta,
}: ScenarioMetaFormProps) {
  return (
    <div className="scenario-meta">
      <label>
        Название сценария
        <input
          value={scenario.name}
          onChange={(event) =>
            onUpdateScenarioMeta({ name: event.target.value })
          }
        />
      </label>
      <label>
        Описание
        <textarea
          value={scenario.description}
          onChange={(event) =>
            onUpdateScenarioMeta({ description: event.target.value })
          }
        />
      </label>
    </div>
  )
}

type StepLayoutProps = {
  activeScenario: OnboardingScenario
  activeStep: OnboardingStep
  onSelectStep: (stepId: string) => void
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
}

function StepLayout({
  activeScenario,
  activeStep,
  onSelectStep,
  onUpdateStep,
}: StepLayoutProps) {
  return (
    <div className="steps-layout">
      <div className="steps-timeline">
        {activeScenario.steps
          .toSorted((left, right) => left.order - right.order)
          .map((step) => (
            <button
              className={step.id === activeStep.id ? 'is-active' : undefined}
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              type="button"
            >
              <strong>{step.order}</strong>
              <span>{step.title}</span>
              <small>{step.pagePath}</small>
            </button>
          ))}
      </div>

      <StepForm
        activeScenario={activeScenario}
        activeStep={activeStep}
        onUpdateStep={onUpdateStep}
      />
    </div>
  )
}

type StepFormProps = {
  activeScenario: OnboardingScenario
  activeStep: OnboardingStep
  onUpdateStep: (patch: Partial<OnboardingStep>) => void
}

function StepForm({
  activeScenario,
  activeStep,
  onUpdateStep,
}: StepFormProps) {
  return (
    <div className="step-form">
      <label>
        Заголовок подсказки
        <input
          value={activeStep.title}
          onChange={(event) => onUpdateStep({ title: event.target.value })}
        />
      </label>
      <label>
        Текст подсказки
        <textarea
          value={activeStep.body}
          onChange={(event) => onUpdateStep({ body: event.target.value })}
        />
      </label>
      <div className="form-grid">
        <label>
          Страница
          <select
            value={activeStep.pagePath}
            onChange={(event) => onUpdateStep({ pagePath: event.target.value })}
          >
            {activeScenario.pages.map((page) => (
              <option key={page.id} value={page.path}>
                {page.path}
              </option>
            ))}
          </select>
        </label>
        <label>
          Селектор элемента
          <input
            value={activeStep.selector}
            onChange={(event) => onUpdateStep({ selector: event.target.value })}
          />
        </label>
        <label>
          Позиция подсказки
          <select
            value={activeStep.placement}
            onChange={(event) =>
              onUpdateStep({
                placement: event.target.value as OnboardingStep['placement'],
              })
            }
          >
            <option value="right">Справа</option>
            <option value="left">Слева</option>
            <option value="top">Сверху</option>
            <option value="bottom">Снизу</option>
          </select>
        </label>
        <label>
          Завершение шага
          <select
            value={activeStep.completion}
            onChange={(event) =>
              onUpdateStep({
                completion: event.target.value as OnboardingStep['completion'],
              })
            }
          >
            <option value="next_button">Кнопка далее</option>
            <option value="target_click">Клик по элементу</option>
            <option value="navigate">Переход</option>
          </select>
        </label>
        <label>
          URL перехода
          <input
            placeholder="Опционально"
            value={activeStep.nextUrl ?? ''}
            onChange={(event) =>
              onUpdateStep({ nextUrl: event.target.value || undefined })
            }
          />
        </label>
        <label>
          Условие показа
          <input
            placeholder="Например: firstListing=true"
            value={activeStep.condition ?? ''}
            onChange={(event) =>
              onUpdateStep({ condition: event.target.value || undefined })
            }
          />
        </label>
      </div>
    </div>
  )
}
