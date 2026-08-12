import {
  initOnboarding,
  type OnboardingApiClient,
  type OnboardingInstance,
  type WidgetConfig,
} from '@m2ie/onboarding-sdk'
import type { PreviewConfig } from '../../shared/messages/types'

export function createPreviewApiClient(
  preview: PreviewConfig,
): OnboardingApiClient {
  const scenarioId = createPreviewId()
  const config: WidgetConfig = {
    projectKey: preview.projectKey,
    flowKey: scenarioId,
    scenarioId,
    scenarioName: 'Extension preview',
    version: 1,
    versionId: scenarioId,
    pageUrl: preview.pageUrl,
    stepOffset: 0,
    totalSteps: preview.steps.length,
    steps: preview.steps.map((step, index) => ({
      ...step,
      order: index + 1,
      versionId: scenarioId,
      placement: 'right',
      completion: 'next_button',
    })),
  }

  return {
    async getConfig() {
      return config
    },
    async trackEvent() {
      // Preview events intentionally never leave the current tab.
    },
  }
}

export function createPreviewRuntime() {
  let instance: OnboardingInstance | undefined

  return {
    start(config: PreviewConfig) {
      instance?.destroy()

      if (config.steps.length === 0) {
        instance = undefined
        return
      }

      instance = initOnboarding({
        apiClient: createPreviewApiClient(config),
        pageUrl: config.pageUrl,
        projectKey: config.projectKey,
      })
    },
    stop() {
      instance?.destroy()
      instance = undefined
    },
  }
}

function createPreviewId() {
  return `preview-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}
