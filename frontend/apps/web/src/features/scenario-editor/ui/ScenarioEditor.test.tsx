import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { ScenarioEditor } from './ScenarioEditor'
import { validateScenario } from '../model/scenarioValidation'

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
      scenarios: defaultScenarios,
      onAddStep: jest.fn(),
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
      scenarios: [activeScenario, archivedScenario],
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
      scenarios: [archivedScenario],
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
      scenarios: [invalidScenario],
      validation: validateScenario(invalidScenario),
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Проверьте сценарий перед публикацией',
    )
    expect(screen.getByText('Укажите понятное название сценария.')).toBeInTheDocument()
  })
})
