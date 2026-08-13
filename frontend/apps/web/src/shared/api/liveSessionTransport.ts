import type { LiveSessionEnvelope } from '@interactive-onboarding/shared'
import type { OnboardingEventPayload } from '@m2ie/onboarding-sdk'

export type OnboardingLiveEnvelope = LiveSessionEnvelope<OnboardingEventPayload>

export type LiveSessionTransport = {
  publish(message: OnboardingLiveEnvelope): void
  subscribe(listener: (message: OnboardingLiveEnvelope) => void): () => void
  close(): void
}

export function createBroadcastChannelLiveSessionTransport(
  runId: string,
): LiveSessionTransport {
  if (typeof BroadcastChannel === 'undefined') {
    throw new Error('Live Session не поддерживается этим браузером')
  }

  const channel = new BroadcastChannel(getLiveSessionChannelName(runId))
  const listeners = new Set<(message: OnboardingLiveEnvelope) => void>()
  const handleMessage = (event: MessageEvent<unknown>) => {
    const message = event.data
    if (!isLiveSessionEnvelope(message, runId)) return
    listeners.forEach((listener) => listener(message))
  }
  channel.addEventListener('message', handleMessage)

  return {
    publish(message) {
      if (isLiveSessionEnvelope(message, runId)) channel.postMessage(message)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    close() {
      listeners.clear()
      channel.removeEventListener('message', handleMessage)
      channel.close()
    },
  }
}

export function getLiveSessionChannelName(runId: string) {
  return `interactive-onboarding:live:${runId}`
}

export function isLiveSessionEnvelope(
  value: unknown,
  runId: string,
): value is OnboardingLiveEnvelope {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OnboardingLiveEnvelope>
  const event = candidate.event as Partial<OnboardingEventPayload> | undefined
  return (
    candidate.version === 1 &&
    candidate.runId === runId &&
    typeof candidate.sequence === 'number' &&
    typeof candidate.emittedAt === 'string' &&
    Boolean(event) &&
    typeof event?.eventKey === 'string' &&
    typeof event?.scenarioId === 'string' &&
    typeof event?.type === 'string' &&
    typeof event?.pageUrl === 'string'
  )
}
