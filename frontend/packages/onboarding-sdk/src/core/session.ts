const STORAGE_KEY = 'interactive-onboarding:session-id'
const OUTCOMES_STORAGE_KEY = 'interactive-onboarding:scenario-outcomes:v1'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SessionCrypto = Pick<Crypto, 'getRandomValues'> &
  Partial<Pick<Crypto, 'randomUUID'>>

export type ScenarioOutcome = 'completed' | 'dismissed'

export function getOrCreateSessionId() {
  const existing = window.sessionStorage.getItem(STORAGE_KEY)

  if (existing && UUID_PATTERN.test(existing)) {
    return existing
  }

  const sessionId = createSessionId()

  window.sessionStorage.setItem(STORAGE_KEY, sessionId)

  return sessionId
}

export function createSessionId(
  cryptoSource: SessionCrypto | null = globalThis.crypto,
) {
  if (cryptoSource?.randomUUID) {
    return cryptoSource.randomUUID()
  }

  const bytes = new Uint8Array(16)

  if (cryptoSource?.getRandomValues) {
    cryptoSource.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
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
