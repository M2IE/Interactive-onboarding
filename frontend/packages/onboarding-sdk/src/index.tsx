import { createRoot, type Root } from 'react-dom/client'
import type { OnboardingApiClient } from '@interactive-onboarding/shared'
import { createHttpOnboardingClient } from './api/httpClient'
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
      <OnboardingWidget
        apiClient={apiClient}
        enabled={options.enabled}
        navigate={options.navigate}
        pageUrl={options.pageUrl}
        projectKey={options.projectKey}
        refreshKey={refreshKey}
        userId={options.userId}
      />,
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

export { createHttpOnboardingClient } from './api/httpClient'
export type {
  OnboardingApiClient,
  OnboardingEventPayload,
  OnboardingScenario,
  OnboardingStep,
  WidgetConfig,
} from '@interactive-onboarding/shared'

function unmount(root: Root, container: HTMLDivElement) {
  root.unmount()
  container.remove()
}
