import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type { OnboardingApiClient, OnboardingEventHandler } from '@m2ie/onboarding-sdk'
import { resetOnboardingSession } from '@m2ie/onboarding-sdk'
import {
  createBroadcastChannelLiveSessionTransport,
  type LiveSessionTransport,
} from '@/shared/api/liveSessionTransport'

export function useLiveSessionPublisher(
  runId: string | null,
  apiClient: OnboardingApiClient,
) {
  const transportRef = useRef<LiveSessionTransport | null>(null)
  const sequenceRef = useRef(0)

  useLayoutEffect(() => {
    transportRef.current?.close()
    transportRef.current = null
    sequenceRef.current = 0
    if (!runId) return

    resetOnboardingSession()
    try {
      const transport = createBroadcastChannelLiveSessionTransport(runId)
      transportRef.current = transport
      return () => transport.close()
    } catch {
      return
    }
  }, [runId])

  const previewClient = useMemo<OnboardingApiClient>(
    () =>
      runId
        ? { ...apiClient, trackEvent: async () => undefined }
        : apiClient,
    [apiClient, runId],
  )

  const handleEvent = useCallback<OnboardingEventHandler>(
    (event) => {
      if (!runId) return
        sequenceRef.current += 1
        transportRef.current?.publish({
          version: 1,
          runId,
          sequence: sequenceRef.current,
          emittedAt: new Date().toISOString(),
          event,
        })
    },
    [runId],
  )
  const onEvent = runId ? handleEvent : undefined

  return { onEvent, onboardingClient: previewClient }
}
