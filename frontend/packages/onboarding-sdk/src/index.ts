import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createHttpOnboardingClient } from './api/httpClient'
import type {
  OnboardingApiClient,
  OnboardingEligibility,
  OnboardingEventHandler,
} from './types/contracts'
import { OnboardingWidget } from './ui/OnboardingWidget'
import { resetOnboardingSession } from './core/session'

export type OnboardingInitOptions = {
  projectKey: string
  apiBaseUrl?: string
  apiClient?: OnboardingApiClient
  navigate?: (url: string) => void
  pageUrl?: string
  userId?: string
  enabled?: boolean
  eligibility?: OnboardingEligibility
  showDelayMs?: number
  targetWaitMs?: number
  onComplete?: () => void
  onEvent?: OnboardingEventHandler
}

export type OnboardingInstance = {
  refresh: () => void
  destroy: () => void
}

export function initOnboarding(options: OnboardingInitOptions): OnboardingInstance {
  const apiClient =
    options.apiClient ??
    createHttpOnboardingClient({
      apiBaseUrl:
        options.apiBaseUrl ?? new URL('/api/v1', window.location.origin).href,
    })

  const container = document.createElement('div')
  container.setAttribute('data-onboarding-sdk-root', options.projectKey)
  document.body.append(container)

  const root = createRoot(container)
  let refreshKey = 0

  const render = () => {
    root.render(
      createElement(OnboardingWidget, {
        apiClient,
        eligibility: options.eligibility,
        enabled: options.enabled,
        navigate: options.navigate,
        pageUrl: options.pageUrl,
        projectKey: options.projectKey,
        refreshKey,
        showDelayMs: options.showDelayMs,
        targetWaitMs: options.targetWaitMs,
        onComplete: options.onComplete,
        onEvent: options.onEvent,
        userId: options.userId,
      }),
    )
  }

  render()

  return {
    refresh() {
      refreshKey += 1
      render()
    },
    destroy() {
      unmount(root, container)
    },
  }
}

export {
  createHttpOnboardingClient,
  OnboardingApiError,
} from './api/httpClient'
export { resetOnboardingSession }
export type {
  FetchClient,
  HttpOnboardingClientOptions,
} from './api/httpClient'
export type {
  OnboardingApiClient,
  OnboardingEligibility,
  OnboardingEligibilityContext,
  OnboardingEventHandler,
  OnboardingEventPayload,
  OnboardingEventType,
  OnboardingScenario,
  OnboardingStep,
  ScenarioStatus,
  StepCompletionMode,
  StepPlacement,
  WidgetConfig,
  WidgetConfigRequest,
  WidgetFlowPage,
} from './types/contracts'

function unmount(root: Root, container: HTMLDivElement) {
  root.unmount()
  container.remove()
}
