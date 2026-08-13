import type { OnboardingScenario } from '@m2ie/onboarding-sdk'
import type { AsyncState } from '@/shared/lib/asyncState'

export type JourneyNodeKind = 'scenario' | 'missing' | 'external'

export type JourneyNode = {
  id: string
  kind: JourneyNodeKind
  path: string
  name: string
  stepCount: number
  scenario?: OnboardingScenario
}

export type JourneyEdge = {
  id: string
  source: string
  target: string
  count: number
  stepTitles: string[]
}

export type JourneyDiagnostic = {
  id: string
  kind: 'multiple_roots' | 'unreachable' | 'cycle' | 'self_loop' | 'missing_target'
  message: string
  nodeIds: string[]
}

export type JourneyGraph = {
  nodes: JourneyNode[]
  edges: JourneyEdge[]
  rootIds: string[]
  diagnostics: JourneyDiagnostic[]
}

export type JourneyMetrics = {
  views: number
  completed: number
  conversion: number
}

export type JourneyMapState = {
  graph: AsyncState<JourneyGraph>
  metrics: Record<string, AsyncState<JourneyMetrics>>
  selectedNodeId?: string
  search: string
}
