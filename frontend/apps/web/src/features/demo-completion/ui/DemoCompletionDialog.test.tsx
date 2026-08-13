import { fireEvent, render, screen } from '@testing-library/react'
import { DemoCompletionDialog } from './DemoCompletionDialog'

describe('DemoCompletionDialog', () => {
  it('offers repeat and home actions after the demo', () => {
    const onRepeat = jest.fn()
    const onReturnHome = jest.fn()

    render(
      <DemoCompletionDialog
        open
        onRepeat={onRepeat}
        onReturnHome={onReturnHome}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Демо завершено' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить демо' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Вернуться на главную' }),
    )

    expect(onRepeat).toHaveBeenCalledTimes(1)
    expect(onReturnHome).toHaveBeenCalledTimes(1)
  })
})
