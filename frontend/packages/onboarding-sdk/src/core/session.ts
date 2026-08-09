const STORAGE_KEY = 'interactive-onboarding:session-id'
const OUTCOMES_STORAGE_KEY = 'interactive-onboarding:scenario-outcomes:v1'

export type ScenarioOutcome = 'completed' | 'dismissed'

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

export function hasScenarioOutcome(scenarioId: string) {
  return readScenarioOutcomes().some((item) => item.scenarioId === scenarioId)
}

export function rememberScenarioOutcome(
  scenarioId: string,
  outcome: ScenarioOutcome,
) {
  const outcomes = readScenarioOutcomes().filter(
    (item) => item.scenarioId !== scenarioId,
  )

  window.sessionStorage.setItem(
    OUTCOMES_STORAGE_KEY,
    JSON.stringify([...outcomes, { scenarioId, outcome }]),
  )
}

function readScenarioOutcomes(): Array<{
  scenarioId: string
  outcome: ScenarioOutcome
}> {
  const value = window.sessionStorage.getItem(OUTCOMES_STORAGE_KEY)

  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isScenarioOutcome)
  } catch {
    return []
  }
}

function isScenarioOutcome(
  value: unknown,
): value is { scenarioId: string; outcome: ScenarioOutcome } {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.scenarioId === 'string' &&
    (item.outcome === 'completed' || item.outcome === 'dismissed')
  )
}
