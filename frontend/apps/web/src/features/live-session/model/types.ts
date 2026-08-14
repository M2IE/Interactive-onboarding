import type { OnboardingEventPayload } from '@m2ie/onboarding-sdk'

export type LiveViewport = 'desktop' | 'mobile'

export type LiveSessionState =
  | { status: 'idle'; viewport: LiveViewport }
  | {
      status: 'starting'
      viewport: LiveViewport
      runId: string
      startUrl: string
      events: OnboardingEventPayload[]
    }
  | {
      status: 'running'
      viewport: LiveViewport
      runId: string
      startUrl: string
      events: OnboardingEventPayload[]
      currentScenarioId?: string
      currentStepId?: string
    }
  | {
      status: 'completed' | 'dismissed'
      viewport: LiveViewport
      runId: string
      startUrl: string
      events: OnboardingEventPayload[]
      currentScenarioId?: string
      currentStepId?: string
    }
  | {
      status: 'error'
      viewport: LiveViewport
      error: string
      runId?: string
      startUrl?: string
      events: OnboardingEventPayload[]
    }
