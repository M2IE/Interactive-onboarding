const STORAGE_KEY = 'interactive-onboarding:session-id'

export function getOrCreateSessionId() {
  const existing = window.sessionStorage.getItem(STORAGE_KEY)

  if (existing) {
    return existing
  }

  const sessionId =
    globalThis.crypto?.randomUUID?.() ??
    `session-${Date.now()}-${Math.random().toString(16).slice(2)}`

  window.sessionStorage.setItem(STORAGE_KEY, sessionId)

  return sessionId
}
