import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  ExtensionScenarioEditor,
  type ExtensionScenarioEditorController,
} from './ExtensionScenarioEditor'

describe('ExtensionScenarioEditor', () => {
  it('offers to create a page-local draft without touching a published scenario', () => {
    const createDraft = jest.fn()
    const controller = {
      state: {
        status: 'empty',
        settings: {
          platformUrl: 'https://platform.example.com',
          projectKey: 'demo',
        },
        context: {
          tabId: 42,
          origin: 'https://classified.example.com',
          pathname: '/products',
          title: 'Products',
          url: 'https://classified.example.com/products',
        },
        projectId: 'project-1',
        hasPublishedScenario: true,
      },
      createDraft,
      openSettings: jest.fn(),
    } as unknown as ExtensionScenarioEditorController

    render(<ExtensionScenarioEditor controller={controller} />)
    fireEvent.click(screen.getByRole('button', { name: 'Создать черновик' }))

    expect(createDraft).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText('Опубликованный сценарий останется без изменений.'),
    ).toBeInTheDocument()
  })

  it('renders a recoverable API error state', () => {
    const retry = jest.fn()
    const controller = {
      state: {
        status: 'error',
        message: 'API unavailable',
        settings: {
          platformUrl: 'https://platform.example.com',
          projectKey: 'demo',
        },
        context: {
          tabId: 42,
          origin: 'https://classified.example.com',
          pathname: '/products',
          title: 'Products',
          url: 'https://classified.example.com/products',
        },
      },
      retry,
    } as unknown as ExtensionScenarioEditorController

    render(<ExtensionScenarioEditor controller={controller} />)
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(retry).toHaveBeenCalledTimes(1)
    expect(screen.getByText('API unavailable')).toBeInTheDocument()
  })

  it('opens the page requirements guide from the setup screen', () => {
    const controller = {
      state: {
        status: 'setup',
        form: { platformUrl: '', projectKey: '' },
      },
      cancelSettings: jest.fn(),
      saveSettings: jest.fn(),
      updateSettingsForm: jest.fn(),
    } as unknown as ExtensionScenarioEditorController

    render(<ExtensionScenarioEditor controller={controller} />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Требования к странице' }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Требования к странице' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('data-onboarding-id', { exact: false }),
    ).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('explains cross-page navigation without implementation terms', () => {
    const controller = createReadyController({
      interaction: { status: 'waiting_navigation', stepId: 'step-1' },
    })

    const { container } = render(
      <ExtensionScenarioEditor controller={controller} />,
    )

    expect(
      screen.getByText(
        'Оставайтесь в этой вкладке и перейдите через интерфейс сайта. Расширение продолжит настройку автоматически.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/nextUrl|pathname/)).not.toBeInTheDocument()
    expect(container.querySelectorAll('.extension-brand__mark i')).toHaveLength(4)
    expect(container.querySelector('.interaction-bar')).toBeInTheDocument()
  })
})

function createReadyController(
  patch: Partial<
    Extract<ExtensionScenarioEditorController['state'], { status: 'ready' }>
  > = {},
) {
  return {
    state: {
      status: 'ready',
      settings: {
        platformUrl: 'https://platform.example.com',
        projectKey: 'demo',
      },
      context: {
        tabId: 42,
        origin: 'https://classified.example.com',
        pathname: '/products',
        title: 'Products',
        url: 'https://classified.example.com/products',
      },
      draft: {
        id: 'scenario-1',
        projectId: 'project-1',
        name: 'Products onboarding',
        url: '/products',
        steps: [
          {
            id: 'step-1',
            persisted: true,
            order: 1,
            selector: '[data-onboarding-id="products"]',
            title: 'Products',
            body: 'Choose a product',
          },
        ],
      },
      selectedStepId: 'step-1',
      hasPublishedScenario: false,
      save: { status: 'clean' },
      interaction: { status: 'idle' },
      ...patch,
    },
    selectedStep: {
      id: 'step-1',
      persisted: true,
      order: 1,
      selector: '[data-onboarding-id="products"]',
      title: 'Products',
      body: 'Choose a product',
    },
    addStep: jest.fn(),
    deleteStep: jest.fn(),
    keepCurrentDraft: jest.fn(),
    moveStep: jest.fn(),
    openAdmin: jest.fn(),
    openSettings: jest.fn(),
    previewScenario: jest.fn(),
    previewStep: jest.fn(),
    retargetStep: jest.fn(),
    saveDraft: jest.fn(),
    selectStep: jest.fn(),
    stopInteraction: jest.fn(),
    switchToChangedPage: jest.fn(),
    updateScenarioName: jest.fn(),
    updateStep: jest.fn(),
    waitForNextPage: jest.fn(),
  } as unknown as ExtensionScenarioEditorController
}
