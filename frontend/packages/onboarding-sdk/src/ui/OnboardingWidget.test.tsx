import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type {
  OnboardingApiClient,
  OnboardingStep,
  WidgetConfig,
} from '../types/contracts'
import { OnboardingWidget } from './OnboardingWidget'

describe('OnboardingWidget', () => {
  afterEach(() => {
    document.body.replaceChildren()
    window.sessionStorage.clear()
  })

  it('renders fixed navigation button labels instead of config-provided labels', async () => {
    createTarget('create-button')
    const step = {
      ...createStep(),
      primaryActionLabel: 'Готово',
      backActionLabel: 'Вернуться',
    } as OnboardingStep & Record<string, string>

    render(
      <OnboardingWidget
        apiClient={createApiClient(step)}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    expect(await screen.findByText(/далее/i)).toBeTruthy()
    expect(screen.getByText(/назад/i)).toBeTruthy()
    expect(screen.getByText(/пропустить/i)).toBeTruthy()
    expect(screen.queryByText('Готово')).toBeNull()
    expect(screen.queryByText('Вернуться')).toBeNull()
    expect(
      document.getElementById('interactive-onboarding-sdk-styles'),
    ).not.toBeNull()
  })

  it('uses host navigation without reloading for a cross-page step', async () => {
    createTarget('create-button')
    const navigate = jest.fn<(url: string) => void>()
    const step = createStep({
      completion: 'navigate',
      nextUrl: '/demo/new',
    })

    render(
      <OnboardingWidget
        apiClient={createApiClient(step)}
        navigate={navigate}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    fireEvent.click(await screen.findByText(/далее/i))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/demo/new'))
  })

  it('waits for step completion before navigating to nextUrl', async () => {
    createTarget('create-button')
    const navigate = jest.fn<(url: string) => void>()
    const step = createStep({
      completion: 'navigate',
      nextUrl: '/demo/new',
    })
    const apiClient = createApiClient(step)
    let finishStepCompletion: (() => void) | undefined

    jest.mocked(apiClient.trackEvent).mockImplementation(async (event) => {
      if (event.type === 'step_completed') {
        await new Promise<void>((resolve) => {
          finishStepCompletion = resolve
        })
      }
    })

    render(
      <OnboardingWidget
        apiClient={apiClient}
        navigate={navigate}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    const nextButton = await screen.findByRole('button', { name: /далее/i })
    fireEvent.click(nextButton)

    expect(nextButton).toBeDisabled()
    expect(navigate).not.toHaveBeenCalled()

    finishStepCompletion?.()

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/demo/new'))
  })

  it('remembers a completed cross-page scenario before navigation', async () => {
    createTarget('create-button')
    const navigate = jest.fn<(url: string) => void>()
    const apiClient = createApiClient(
      createStep({
        completion: 'navigate',
        nextUrl: '/demo/new',
      }),
    )
    const firstView = render(
      <OnboardingWidget
        apiClient={apiClient}
        navigate={navigate}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    fireEvent.click(await screen.findByText(/далее/i))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/demo/new'))
    firstView.unmount()

    render(
      <OnboardingWidget
        apiClient={apiClient}
        navigate={navigate}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    await waitFor(() => expect(apiClient.getConfig).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Начните сценарий')).toBeNull()
    expect(
      jest
        .mocked(apiClient.trackEvent)
        .mock.calls.filter(([event]) => event.type === 'step_viewed'),
    ).toHaveLength(1)
  })

  it('requests a fresh scenario when the SPA path changes', async () => {
    createTarget('profile-button')
    createTarget('category-button')
    const getConfig = jest
      .fn<OnboardingApiClient['getConfig']>()
      .mockImplementation(async ({ pageUrl }) =>
        createConfig(
          pageUrl === '/demo/profile'
            ? createStep({
                id: 'profile-step',
                selector: '[data-onboarding-id="profile-button"]',
                title: 'Profile step',
              })
            : createStep({
                id: 'category-step',
                selector: '[data-onboarding-id="category-button"]',
                title: 'Category step',
              }),
          pageUrl,
        ),
      )
    const apiClient = createApiClient(createStep(), getConfig)
    const view = render(
      <OnboardingWidget
        apiClient={apiClient}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    expect(await screen.findByText('Profile step')).toBeTruthy()

    view.rerender(
      <OnboardingWidget
        apiClient={apiClient}
        pageUrl="/demo/new"
        projectKey="avito-demo"
      />,
    )

    expect(await screen.findByText('Category step')).toBeTruthy()
    expect(getConfig).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pageUrl: '/demo/new' }),
    )
  })

  it('waits for a dynamic target before showing and tracking the step', async () => {
    const apiClient = createApiClient(createStep())

    render(
      <OnboardingWidget
        apiClient={apiClient}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
        targetWaitMs={1_000}
      />,
    )

    await waitFor(() => expect(apiClient.getConfig).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Начните сценарий')).toBeNull()

    createTarget('create-button')

    expect(await screen.findByText('Начните сценарий')).toBeTruthy()
    expect(
      jest
        .mocked(apiClient.trackEvent)
        .mock.calls.some(([event]) => event.type === 'target_not_found'),
    ).toBe(false)
  })

  it('does not request config when the host marks the user ineligible', async () => {
    const apiClient = createApiClient(createStep())
    const eligibility = jest.fn(async () => false)

    render(
      <OnboardingWidget
        apiClient={apiClient}
        eligibility={eligibility}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    await waitFor(() => expect(eligibility).toHaveBeenCalledTimes(1))
    expect(apiClient.getConfig).not.toHaveBeenCalled()
  })

  it('returns to the last step of the previous page', async () => {
    createTarget('profile-button')
    createTarget('category-button')
    const navigate = jest.fn<(url: string) => void>()
    const profileStep = createStep({
      id: 'profile-step',
      selector: '[data-onboarding-id="profile-button"]',
      title: 'Profile step',
      nextUrl: '/demo/new',
    })
    const categoryStep = createStep({
      id: 'category-step',
      selector: '[data-onboarding-id="category-button"]',
      title: 'Category step',
    })
    const getConfig = jest
      .fn<OnboardingApiClient['getConfig']>()
      .mockImplementation(async ({ pageUrl }) =>
        createConfig(
          pageUrl === '/demo/profile' ? profileStep : categoryStep,
          pageUrl,
        ),
      )
    const apiClient = createApiClient(profileStep, getConfig)
    const view = render(
      <OnboardingWidget
        apiClient={apiClient}
        navigate={navigate}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Далее' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/demo/new'))

    view.rerender(
      <OnboardingWidget
        apiClient={apiClient}
        navigate={navigate}
        pageUrl="/demo/new"
        projectKey="avito-demo"
      />,
    )

    expect(await screen.findByText('Category step')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    expect(navigate).toHaveBeenLastCalledWith('/demo/profile')

    view.rerender(
      <OnboardingWidget
        apiClient={apiClient}
        navigate={navigate}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    expect(await screen.findByText('Profile step')).toBeTruthy()
  })

  it('does not show a completed scenario again in the same session', async () => {
    createTarget('create-button')
    const apiClient = createApiClient(createStep())
    const firstView = render(
      <OnboardingWidget
        apiClient={apiClient}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    fireEvent.click(await screen.findByText(/далее/i))
    firstView.unmount()

    render(
      <OnboardingWidget
        apiClient={apiClient}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    await waitFor(() => expect(apiClient.getConfig).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Начните сценарий')).toBeNull()
  })
})

function createStep(patch: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    id: 'step-1',
    versionId: 'version-1',
    order: 1,
    selector: '[data-onboarding-id="create-button"]',
    title: 'Начните сценарий',
    body: 'Выделяем важное действие на странице.',
    placement: 'right',
    completion: 'next_button',
    ...patch,
  }
}

function createApiClient(
  step: OnboardingStep,
  getConfig = jest
    .fn<OnboardingApiClient['getConfig']>()
    .mockResolvedValue(createConfig(step)),
): OnboardingApiClient {
  return {
    getConfig,
    trackEvent: jest
      .fn<OnboardingApiClient['trackEvent']>()
      .mockResolvedValue(undefined),
  }
}

function createConfig(
  step: OnboardingStep,
  pageUrl = '/demo/profile',
): WidgetConfig {
  return {
    projectKey: 'avito-demo',
    flowKey: `flow-${step.id}`,
    scenarioId: `scenario-${step.id}`,
    scenarioName: 'Сценарий',
    version: 1,
    versionId: `version-${step.id}`,
    pageUrl,
    stepOffset: 0,
    totalSteps: 1,
    steps: [step],
  }
}

function createTarget(id: string) {
  const target = document.createElement('button')
  target.setAttribute('data-onboarding-id', id)
  target.getBoundingClientRect = () =>
    ({
      bottom: 200,
      height: 40,
      left: 100,
      right: 260,
      top: 160,
      width: 160,
      x: 100,
      y: 160,
      toJSON: () => ({}),
    }) as DOMRect
  document.body.append(target)
}
