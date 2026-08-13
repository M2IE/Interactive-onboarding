import type { OnboardingScenario } from '@m2ie/onboarding-sdk'
import type {
  JourneyDiagnostic,
  JourneyEdge,
  JourneyGraph,
  JourneyNode,
} from './types'

const syntheticBase = 'https://journey.local'

export function normalizeJourneyPath(value: string) {
  try {
    const pathname = new URL(value, syntheticBase).pathname || '/'
    return pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  } catch {
    const pathname = value.split(/[?#]/, 1)[0] || '/'
    const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
    return withLeadingSlash === '/' ? '/' : withLeadingSlash.replace(/\/+$/, '')
  }
}

export function buildJourneyGraph(source: OnboardingScenario[]): JourneyGraph {
  const scenarios = source
    .filter((scenario) => scenario.status === 'published')
    .toSorted((left, right) => left.url.localeCompare(right.url))
  const nodes: JourneyNode[] = scenarios.map((scenario) => ({
    id: scenario.id,
    kind: 'scenario',
    path: normalizeJourneyPath(scenario.url),
    name: scenario.name,
    stepCount: scenario.steps.length,
    scenario,
  }))
  const scenarioByPath = new Map(nodes.map((node) => [node.path, node]))
  const edgeGroups = new Map<string, JourneyEdge>()
  const diagnostics: JourneyDiagnostic[] = []

  for (const node of nodes.filter(hasScenario)) {
    for (const step of node.scenario.steps) {
      if (!step.nextUrl) continue

      const targetPath = normalizeJourneyPath(step.nextUrl)
      let target = scenarioByPath.get(targetPath)

      if (!target) {
        const kind = isAbsoluteExternalUrl(step.nextUrl) ? 'external' : 'missing'
        const id = `${kind}:${targetPath}`
        target = nodes.find((item) => item.id === id)

        if (!target) {
          target = {
            id,
            kind,
            path: targetPath,
            name: kind === 'external' ? 'Внешняя страница' : 'Сценарий не настроен',
            stepCount: 0,
          }
          nodes.push(target)
        }

        diagnostics.push({
          id: `missing:${node.id}:${step.id}`,
          kind: 'missing_target',
          message: `Переход из «${node.name}» ведёт на страницу без опубликованного сценария: ${targetPath}`,
          nodeIds: [node.id, target.id],
        })
      }

      const groupKey = `${node.id}->${target.id}`
      const existing = edgeGroups.get(groupKey)
      if (existing) {
        existing.count += 1
        existing.stepTitles.push(step.title)
      } else {
        edgeGroups.set(groupKey, {
          id: groupKey,
          source: node.id,
          target: target.id,
          count: 1,
          stepTitles: [step.title],
        })
      }

      if (node.id === target.id) {
        diagnostics.push({
          id: `self:${node.id}:${step.id}`,
          kind: 'self_loop',
          message: `Шаг «${step.title}» возвращает пользователя на ту же страницу.`,
          nodeIds: [node.id],
        })
      }
    }
  }

  const edges = [...edgeGroups.values()]
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id))
  const incoming = new Set(
    edges.filter((edge) => scenarioIds.has(edge.target)).map((edge) => edge.target),
  )
  const rootIds = scenarios
    .map((scenario) => scenario.id)
    .filter((id) => !incoming.has(id))

  if (rootIds.length > 1) {
    diagnostics.push({
      id: 'multiple-roots',
      kind: 'multiple_roots',
      message: `Найдено несколько точек входа: ${rootIds.length}.`,
      nodeIds: rootIds,
    })
  }

  const cycles = findCycles(scenarioIds, edges)
  cycles.forEach((nodeIds, index) => {
    diagnostics.push({
      id: `cycle:${index}`,
      kind: 'cycle',
      message: 'В пользовательском пути найден циклический переход.',
      nodeIds,
    })
  })

  if (rootIds.length > 0) {
    const reachable = collectReachable(rootIds, edges)
    const unreachable = [...scenarioIds].filter((id) => !reachable.has(id))
    if (unreachable.length > 0) {
      diagnostics.push({
        id: 'unreachable',
        kind: 'unreachable',
        message: `Часть сценариев недостижима из точек входа: ${unreachable.length}.`,
        nodeIds: unreachable,
      })
    }
  }

  return { nodes, edges, rootIds, diagnostics: deduplicateDiagnostics(diagnostics) }
}

function hasScenario(node: JourneyNode): node is JourneyNode & { scenario: OnboardingScenario } {
  return node.kind === 'scenario' && Boolean(node.scenario)
}

function isAbsoluteExternalUrl(value: string) {
  try {
    return new URL(value).origin !== syntheticBase
  } catch {
    return false
  }
}

function collectReachable(rootIds: string[], edges: JourneyEdge[]) {
  const adjacency = createAdjacency(edges)
  const visited = new Set<string>()
  const queue = [...rootIds]
  while (queue.length > 0) {
    const id = queue.shift()
    if (!id || visited.has(id)) continue
    visited.add(id)
    queue.push(...(adjacency.get(id) ?? []))
  }
  return visited
}

function findCycles(scenarioIds: Set<string>, edges: JourneyEdge[]) {
  const adjacency = createAdjacency(edges)
  const visited = new Set<string>()
  const active = new Set<string>()
  const stack: string[] = []
  const cycleKeys = new Set<string>()
  const cycles: string[][] = []

  function visit(id: string) {
    if (active.has(id)) {
      const start = stack.indexOf(id)
      const cycle = stack.slice(start)
      const key = [...cycle].sort().join(':')
      if (cycle.length > 1 && !cycleKeys.has(key)) {
        cycleKeys.add(key)
        cycles.push(cycle)
      }
      return
    }
    if (visited.has(id)) return
    visited.add(id)
    active.add(id)
    stack.push(id)
    for (const nextId of adjacency.get(id) ?? []) {
      if (scenarioIds.has(nextId)) visit(nextId)
    }
    stack.pop()
    active.delete(id)
  }

  scenarioIds.forEach(visit)
  return cycles
}

function createAdjacency(edges: JourneyEdge[]) {
  const adjacency = new Map<string, string[]>()
  edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target])
  })
  return adjacency
}

function deduplicateDiagnostics(diagnostics: JourneyDiagnostic[]) {
  return [...new Map(diagnostics.map((diagnostic) => [diagnostic.id, diagnostic])).values()]
}
