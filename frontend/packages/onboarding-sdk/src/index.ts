import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createHttpOnboardingClient } from './api/httpClient'
import type { OnboardingApiClient } from './types/contracts'
import { OnboardingWidget } from './ui/OnboardingWidget'

export type OnboardingInitOptions = {
  projectKey: string
  apiBaseUrl?: string
  apiClient?: OnboardingApiClient
  navigate?: (url: string) => void
  pageUrl?: string
  userId?: string
  enabled?: boolean
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
        enabled: options.enabled,
        navigate: options.navigate,
        pageUrl: options.pageUrl,
        projectKey: options.projectKey,
        refreshKey,
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
export type {
  FetchClient,
  HttpOnboardingClientOptions,
} from './api/httpClient'
export type {
  OnboardingApiClient,
  OnboardingEventPayload,
  OnboardingEventType,
  OnboardingScenario,
  OnboardingStep,
  ScenarioStatus,
  StepCompletionMode,
  StepPlacement,
  WidgetConfig,
  WidgetConfigRequest,
} from './types/contracts'

function unmount(root: Root, container: HTMLDivElement) {
  root.unmount()
  container.remove()
}
