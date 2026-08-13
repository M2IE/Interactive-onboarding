import { fireEvent, render, screen } from '@testing-library/react'
import { ScenarioGuideDialog } from './ScenarioGuideDialog'

describe('ScenarioGuideDialog', () => {
  it('guides an administrator from draft creation to analytics', () => {
    render(<ScenarioGuideDialog />)

    fireEvent.click(screen.getByRole('button', { name: 'Как создать сценарий' }))
    expect(
      screen.getByRole('dialog', { name: 'Как создать сценарий' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Основные понятия')).toBeInTheDocument()
    expect(screen.getByText('Набор подсказок для одной конкретной страницы.')).toBeInTheDocument()
    expect(screen.getByText('Создайте сценарий')).toBeInTheDocument()
    expect(screen.getByText('Укажите страницу')).toBeInTheDocument()
    expect(
      screen.getByText('Опубликуйте и следите за результатом'),
    ).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Далее' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Назад' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
