import { afterEach, describe, expect, it } from '@jest/globals'
import {
  consumeScenarioResume,
  createSessionId,
  getOrCreateSessionId,
  hasPreviousOnboardingPage,
  preparePreviousOnboardingPage,
  rememberPageNavigation,
} from './session'

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('onboarding session', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('creates a backend-compatible UUID without Web Crypto', () => {
    expect(createSessionId(null)).toMatch(UUID_V4_PATTERN)
  })

  it('reuses the session UUID within the same browser tab', () => {
    const firstSessionId = getOrCreateSessionId()

    expect(firstSessionId).toMatch(UUID_V4_PATTERN)
    expect(getOrCreateSessionId()).toBe(firstSessionId)
  })

  it('replaces a legacy non-UUID session identifier', () => {
    window.sessionStorage.setItem(
      'interactive-onboarding:session-id',
      'session-1723207841000-abc',
    )

    const sessionId = getOrCreateSessionId()

    expect(sessionId).toMatch(UUID_V4_PATTERN)
    expect(sessionId).not.toContain('session-')
  })

  it('stores a cross-page return point and consumes it once', () => {
    rememberPageNavigation({
      fromPageUrl: '/profile',
      fromScenarioId: 'scenario-profile',
      fromStepIndex: 2,
      toPageUrl: '/new',
    })

    expect(hasPreviousOnboardingPage('/new')).toBe(true)
    expect(preparePreviousOnboardingPage('/new')).toBe('/profile')
    expect(hasPreviousOnboardingPage('/new')).toBe(false)
    expect(consumeScenarioResume('/profile', 'scenario-profile')).toBe(2)
    expect(consumeScenarioResume('/profile', 'scenario-profile')).toBeNull()
  })

  it('matches absolute and relative navigation URLs by pathname', () => {
    rememberPageNavigation({
      fromPageUrl: '/profile',
      fromScenarioId: 'scenario-profile',
      fromStepIndex: 0,
      toPageUrl: 'https://classified.example.com/new?source=profile',
    })

    expect(hasPreviousOnboardingPage('/new?source=profile')).toBe(true)
  })
})
