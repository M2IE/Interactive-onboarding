import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import type {
  OnboardingApiClient,
  OnboardingStep,
  WidgetConfig,
} from '@interactive-onboarding/shared'
import { OnboardingWidget } from './OnboardingWidget'

describe('OnboardingWidget', () => {
  it('renders fixed navigation button labels instead of config-provided labels', async () => {
    const target = document.createElement('button')
    target.setAttribute('data-onboarding-id', 'create-button')
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

    const step = {
      id: 'step-1',
      versionId: 'version-1',
      pageId: 'page-1',
      pagePath: '/demo/profile',
      order: 1,
      selector: '[data-onboarding-id="create-button"]',
      title: 'Начните сценарий',
      body: 'Выделяем важное действие на странице.',
      placement: 'right',
      completion: 'next_button',
      primaryActionLabel: 'Готово',
      backActionLabel: 'Вернуться',
    } as OnboardingStep & Record<string, string>
    const apiClient: OnboardingApiClient = {
      getConfig: jest.fn<OnboardingApiClient['getConfig']>().mockResolvedValue({
        projectKey: 'avito-demo',
        flowKey: 'first-listing',
        scenarioId: 'scenario-1',
        scenarioName: 'Сценарий',
        version: 1,
        versionId: 'version-1',
        pagePath: '/demo/profile',
        totalSteps: 1,
        steps: [step],
      } satisfies WidgetConfig),
      trackEvent: jest
        .fn<OnboardingApiClient['trackEvent']>()
        .mockResolvedValue(undefined),
    }

    render(
      <OnboardingWidget
        apiClient={apiClient}
        pageUrl="/demo/profile"
        projectKey="avito-demo"
      />,
    )

    expect(await screen.findByText('далее')).toBeTruthy()
    expect(screen.getByText('назад')).toBeTruthy()
    expect(screen.getByText('пропустить')).toBeTruthy()
    expect(screen.queryByText('Готово')).toBeNull()
    expect(screen.queryByText('Вернуться')).toBeNull()
  })
})
