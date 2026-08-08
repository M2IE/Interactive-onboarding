import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { ScenarioEditor } from './ScenarioEditor'

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
      workflow: { status: 'ready' },
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
})
