import { render, screen } from '@testing-library/react'
import {
  ResizablePanel,
  ResizableWorkspace,
  ResizeHandle,
} from './resizable'

describe('ResizableWorkspace', () => {
  it('composes labelled panels and an accessible resize separator', () => {
    render(
      <ResizableWorkspace
        panelIds={['navigation', 'content']}
        storageKey="test-workspace"
      >
        <ResizablePanel defaultSize="30%" id="navigation" minSize={200}>
          <nav>Навигация</nav>
        </ResizablePanel>
        <ResizeHandle id="content-handle" label="Изменить ширину контента" />
        <ResizablePanel defaultSize="70%" id="content" minSize={300}>
          <main>Контент</main>
        </ResizablePanel>
      </ResizableWorkspace>,
    )

    expect(screen.getByText('Навигация')).toBeInTheDocument()
    expect(screen.getByText('Контент')).toBeInTheDocument()
    expect(
      screen.getByRole('separator', { name: 'Изменить ширину контента' }),
    ).toHaveAttribute('tabindex', '0')
  })
})
