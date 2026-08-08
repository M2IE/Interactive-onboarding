import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import type {
  OnboardingApiClient,
  OnboardingStep,
  WidgetConfig,
} from '@interactive-onboarding/shared'
import { OnboardingWidget } from './OnboardingWidget'

describe('OnboardingWidget', () => {
  afterEach(() => {
    document.body.replaceChildren()
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

    expect(navigate).toHaveBeenCalledWith('/demo/new')
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

function createApiClient(step: OnboardingStep): OnboardingApiClient {
  return {
    getConfig: jest.fn<OnboardingApiClient['getConfig']>().mockResolvedValue({
      projectKey: 'avito-demo',
      flowKey: 'first-listing',
      scenarioId: 'scenario-1',
      scenarioName: 'Сценарий',
      version: 1,
      versionId: 'version-1',
      pageUrl: '/demo/profile',
      stepOffset: 0,
      totalSteps: 1,
      steps: [step],
    } satisfies WidgetConfig),
    trackEvent: jest
      .fn<OnboardingApiClient['trackEvent']>()
      .mockResolvedValue(undefined),
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
