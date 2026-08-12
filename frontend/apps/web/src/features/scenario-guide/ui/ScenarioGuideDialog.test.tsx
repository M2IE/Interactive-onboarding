import { fireEvent, render, screen } from '@testing-library/react'
import { ScenarioGuideDialog } from './ScenarioGuideDialog'

describe('ScenarioGuideDialog', () => {
  it('guides an administrator from draft creation to analytics', () => {
    render(<ScenarioGuideDialog />)

    fireEvent.click(screen.getByRole('button', { name: 'Как создать сценарий' }))
    expect(
      screen.getByRole('dialog', { name: 'Как создать сценарий' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Создайте сценарий')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Далее' }))
    expect(screen.getByText('Укажите страницу')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Термины платформы'))
    expect(screen.getByText('Набор подсказок для одной конкретной страницы.')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Шаг 6: Опубликуйте и следите за результатом',
      }),
    )
    expect(
      screen.getByText('Опубликуйте и следите за результатом'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
