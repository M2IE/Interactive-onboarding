import type { ComponentProps } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { ScenarioEditor } from './ScenarioEditor'
import { validateScenario } from '../model/scenarioValidation'
import { groupScenarioVersions } from '../model/scenarioVersions'

jest.mock('@/shared/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true,
}))

describe('ScenarioEditor', () => {
  const activeScenario = defaultScenarios[0]
  const activeStep = activeScenario.steps[0]

  function renderEditor(
    overrides: Partial<ComponentProps<typeof ScenarioEditor>> = {},
  ) {
    const props: ComponentProps<typeof ScenarioEditor> = {
      activeScenario,
      activeStep,
      scenarioGroups: groupScenarioVersions(defaultScenarios),
      onAddStep: jest.fn(),
      onDeleteStep: jest.fn(),
      onOpenDemo: jest.fn(),
      onSelectScenario: jest.fn(),
      onSelectStep: jest.fn(),
      onUpdateScenarioMeta: jest.fn(),
      onUpdateStep: jest.fn(),
      ...overrides,
    }

    render(<ScenarioEditor {...props} />)

    return props
  }

  it('renders keyboard-accessible desktop resize handles', () => {
    renderEditor()

    expect(
      screen.getByRole('separator', {
        name: 'Изменить ширину списка сценариев',
      }),
    ).toHaveAttribute('aria-orientation', 'vertical')
    expect(
      screen.getByRole('separator', {
        name: 'Изменить ширину предпросмотра',
      }),
    ).toHaveAttribute('tabindex', '0')
  })

  it('filters the scenario registry by name or page path', () => {
    renderEditor()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Поиск сценариев' }), {
      target: { value: 'автомобиль' },
    })

    expect(
      screen.getByRole('button', { name: /Первое объявление: автомобиль/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Первое объявление: профиль/ }),
    ).not.toBeInTheDocument()
  })

  it('emits a scenario patch when the page path changes', () => {
    const onUpdateScenarioMeta = jest.fn()
    renderEditor({ onUpdateScenarioMeta })

    fireEvent.change(screen.getByRole('textbox', { name: 'Путь страницы' }), {
      target: { value: '/demo/new/electronics' },
    })

    expect(onUpdateScenarioMeta).toHaveBeenCalledWith({
      url: '/demo/new/electronics',
    })
  })

  it('shows archived scenarios through the registry filter', () => {
    const archivedScenario = {
      ...activeScenario,
      id: 'scenario-archived',
      name: 'Архивная версия профиля',
      status: 'archived' as const,
    }

    renderEditor({
      scenarioGroups: groupScenarioVersions([activeScenario, archivedScenario]),
    })

    expect(
      screen.queryByRole('button', { name: /Архивная версия профиля/ }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Архив' }))

    expect(
      screen.getByRole('button', { name: /Архивная версия профиля/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Первое объявление: профиль/ }),
    ).not.toBeInTheDocument()
  })

  it('keeps an archived scenario read-only', () => {
    const archivedScenario = {
      ...activeScenario,
      id: 'scenario-archived',
      status: 'archived' as const,
    }

    renderEditor({
      activeScenario: archivedScenario,
      activeStep: archivedScenario.steps[0],
      scenarioGroups: groupScenarioVersions([archivedScenario]),
      readOnly: true,
    })

    expect(
      screen.getByRole('textbox', { name: 'Название сценария' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Открыть демо' }),
    ).toBeDisabled()
    expect(screen.getAllByText('Архивный')).not.toHaveLength(0)
  })

  it('shows publication errors next to the editor', () => {
    const invalidScenario = {
      ...activeScenario,
      name: '',
      url: 'invalid',
    }

    renderEditor({
      activeScenario: invalidScenario,
      activeStep: invalidScenario.steps[0],
      scenarioGroups: groupScenarioVersions([invalidScenario]),
      validation: validateScenario(invalidScenario),
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Проверьте сценарий перед публикацией',
    )
    expect(screen.getByText('Укажите понятное название сценария.')).toBeInTheDocument()
  })

  it('groups draft and published snapshots into one registry item', () => {
    const draft = {
      ...activeScenario,
      id: 'draft-id',
      status: 'draft' as const,
    }
    const published = {
      ...activeScenario,
      id: 'published-id',
      status: 'published' as const,
    }

    renderEditor({
      activeScenario: draft,
      activeStep: draft.steps[0],
      scenarioGroups: groupScenarioVersions([published, draft]),
    })

    expect(screen.getByText('1 сценарий')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /Первое объявление: профиль/ }),
    ).toHaveLength(1)
    expect(screen.getAllByText('Опубликован')).not.toHaveLength(0)
    expect(screen.getAllByText('Черновик')).not.toHaveLength(0)
  })

  it('confirms deletion of an editable step', () => {
    const onDeleteStep = jest.fn()
    renderEditor({ onDeleteStep })

    fireEvent.click(screen.getByRole('button', { name: 'Удалить шаг' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Удалить шаг 1?')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить шаг' }))
    expect(onDeleteStep).toHaveBeenCalledTimes(1)
  })

  it('keeps the registry and settings available when the draft has no steps', () => {
    const emptyDraft = {
      ...activeScenario,
      status: 'draft' as const,
      steps: [],
    }

    renderEditor({
      activeScenario: emptyDraft,
      activeStep: undefined,
      scenarioGroups: groupScenarioVersions([emptyDraft]),
    })

    expect(screen.getByRole('heading', { name: 'Сценарии' })).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Название сценария' }),
    ).toBeEnabled()
    expect(
      screen.getAllByRole('button', { name: 'Добавить шаг' }),
    ).not.toHaveLength(0)
  })
})
