import type { WidgetConfig, WidgetConfigRequest } from '../types/contracts'

const STORAGE_KEY = 'interactive-onboarding:linear-journeys:v1'
const MAX_JOURNEY_DEPTH = 20
const MAX_STORED_JOURNEYS = 10

type JourneyNode = {
  pageUrl: string
  scenarioId: string
  stepCount: number
}

type StoredJourney = {
  projectKey: string
  sessionId: string
  nodes: JourneyNode[]
}

type LinearJourneyResolverOptions = {
  loadConfig(request: WidgetConfigRequest): Promise<WidgetConfig | null>
  storage?: Storage
}

export function createLinearJourneyResolver({
  loadConfig,
  storage = getSessionStorage(),
}: LinearJourneyResolverOptions) {
  return async function resolveLinearJourney(
    request: WidgetConfigRequest,
    currentConfig: WidgetConfig,
  ) {
    const storedJourney = findStoredJourney(storage, request, currentConfig)

    if (storedJourney) {
      return applyJourneyProgress(currentConfig, storedJourney.nodes)
    }

    const nodes = await buildLinearJourney(request, currentConfig, loadConfig)

    if (!nodes) {
      return currentConfig
    }

    rememberJourney(storage, {
      projectKey: request.projectKey,
      sessionId: request.sessionId,
      nodes,
    })
    return applyJourneyProgress(currentConfig, nodes)
  }
}

export function clearLinearJourneyProgress(storage = getSessionStorage()) {
  storage?.removeItem(STORAGE_KEY)
}

async function buildLinearJourney(
  request: WidgetConfigRequest,
  currentConfig: WidgetConfig,
  loadConfig: LinearJourneyResolverOptions['loadConfig'],
): Promise<JourneyNode[] | null> {
  const nodes = [toJourneyNode(currentConfig)]
  const visitedPaths = new Set([normalizePageUrl(currentConfig.pageUrl)])
  let config = currentConfig

  for (let depth = 1; depth < MAX_JOURNEY_DEPTH; depth += 1) {
    const transitionSteps = config.steps.filter((step) => step.nextUrl)

    if (
      transitionSteps.length > 1 ||
      (transitionSteps.length === 1 && transitionSteps[0] !== config.steps.at(-1))
    ) {
      return null
    }

    const nextUrl = transitionSteps[0]?.nextUrl

    if (!nextUrl) {
      return nodes
    }

    const nextPageUrl = normalizePageUrl(nextUrl)

    if (visitedPaths.has(nextPageUrl)) {
      return null
    }

    visitedPaths.add(nextPageUrl)

    try {
      const nextConfig = await loadConfig({ ...request, pageUrl: nextPageUrl })

      if (!nextConfig) {
        return nodes
      }

      nodes.push(toJourneyNode(nextConfig))
      config = nextConfig
    } catch {
      return null
    }
  }

  return config.steps.at(-1)?.nextUrl ? null : nodes
}

function applyJourneyProgress(config: WidgetConfig, nodes: JourneyNode[]) {
  const currentIndex = nodes.findIndex(
    (node) =>
      node.scenarioId === config.scenarioId &&
      node.pageUrl === normalizePageUrl(config.pageUrl),
  )

  if (currentIndex < 0) {
    return config
  }

  return {
    ...config,
    stepOffset: nodes
      .slice(0, currentIndex)
      .reduce((total, node) => total + node.stepCount, 0),
    totalSteps: nodes.reduce((total, node) => total + node.stepCount, 0),
  }
}

function toJourneyNode(config: WidgetConfig): JourneyNode {
  return {
    pageUrl: normalizePageUrl(config.pageUrl),
    scenarioId: config.scenarioId,
    stepCount: config.steps.length,
  }
}

function findStoredJourney(
  storage: Storage | undefined,
  request: WidgetConfigRequest,
  config: WidgetConfig,
) {
  return readJourneys(storage).find(
    (journey) =>
      journey.projectKey === request.projectKey &&
      journey.sessionId === request.sessionId &&
      journey.nodes.some(
        (node) =>
          node.scenarioId === config.scenarioId &&
          node.pageUrl === normalizePageUrl(config.pageUrl),
      ),
  )
}

function rememberJourney(storage: Storage | undefined, journey: StoredJourney) {
  if (!storage) return

  const journeys = readJourneys(storage).filter(
    (item) =>
      item.projectKey !== journey.projectKey ||
      item.sessionId !== journey.sessionId ||
      !item.nodes.some((node) =>
        journey.nodes.some(
          (nextNode) =>
            nextNode.scenarioId === node.scenarioId &&
            nextNode.pageUrl === node.pageUrl,
        ),
      ),
  )
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify([...journeys, journey].slice(-MAX_STORED_JOURNEYS)),
  )
}

function readJourneys(storage: Storage | undefined): StoredJourney[] {
  const value = storage?.getItem(STORAGE_KEY)

  if (!value) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter(isStoredJourney) : []
  } catch {
    return []
  }
}

function isStoredJourney(value: unknown): value is StoredJourney {
  if (!value || typeof value !== 'object') return false
  const journey = value as Record<string, unknown>

  return (
    typeof journey.projectKey === 'string' &&
    typeof journey.sessionId === 'string' &&
    Array.isArray(journey.nodes) &&
    journey.nodes.every(isJourneyNode)
  )
}

function isJourneyNode(value: unknown): value is JourneyNode {
  if (!value || typeof value !== 'object') return false
  const node = value as Record<string, unknown>

  return (
    typeof node.pageUrl === 'string' &&
    typeof node.scenarioId === 'string' &&
    typeof node.stepCount === 'number' &&
    Number.isInteger(node.stepCount) &&
    node.stepCount > 0
  )
}

function normalizePageUrl(value: string) {
  try {
    const url = new URL(value, 'https://onboarding.local')
    return url.pathname.replace(/\/$/, '') || '/'
  } catch {
    return value.split(/[?#]/)[0]?.replace(/\/$/, '') || '/'
  }
}

function getSessionStorage() {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}
