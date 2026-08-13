import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { journeyMapReducer } from '@/features/journey-map'
import { liveSessionReducer } from '@/features/live-session'
import { JourneyStudio } from './JourneyStudio'

jest.mock('@/features/journey-map/ui/JourneyCanvas', () => ({
  JourneyCanvas: ({ graph, onSelectNode }: { graph: { nodes: { id: string; name: string }[] }; onSelectNode(id: string): void }) => (
    <div data-testid="journey-canvas">
      {graph.nodes.map((node) => (
        <button key={node.id} onClick={() => onSelectNode(node.id)} type="button">
          {node.name}
        </button>
      ))}
    </div>
  ),
}))

describe('JourneyStudio', () => {
  it('loads published scenarios and starts a selected path in an iframe', async () => {
    renderStudio(createRepository())

    expect(await screen.findByTestId('journey-canvas')).toBeInTheDocument()
    expect(screen.getAllByText('Первое объявление: профиль')).not.toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Начать отсюда' }))

    await waitFor(() =>
      expect(screen.getByTitle('Интерактивное демо пользовательского пути')).toHaveAttribute(
        'src',
        expect.stringContaining('/demo/profile?liveSession='),
      ),
    )
  })

  it('renders an empty state when there are no published scenarios', async () => {
    renderStudio(createRepository([]))
    expect(await screen.findByText('Нет опубликованных сценариев')).toBeInTheDocument()
  })

  it('renders a recoverable repository error', async () => {
    renderStudio({
      source: 'mock',
      listPublishedScenarios: jest.fn().mockRejectedValue(new Error('API offline')),
      getMetrics: jest.fn(),
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('API offline')
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })
})

function createRepository(scenarios = defaultScenarios) {
  return {
    source: 'mock' as const,
    listPublishedScenarios: jest.fn().mockResolvedValue(scenarios),
    getMetrics: jest.fn().mockResolvedValue({ views: 12, completed: 8, conversion: 67 }),
  }
}

function renderStudio(journeyRepository: ReturnType<typeof createRepository> | {
  source: 'mock'
  listPublishedScenarios: jest.Mock
  getMetrics: jest.Mock
}) {
  const store = configureStore({
    reducer: { journeyMap: journeyMapReducer, liveSession: liveSessionReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { journeyRepository } } }),
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <JourneyStudio />
      </MemoryRouter>
    </Provider>,
  )
}
