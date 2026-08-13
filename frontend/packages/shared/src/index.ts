export type AnalyticsSummary = {
  started: number
  completed: number
  dismissed: number
  completionRate: number
  targetMisses: number
}

export type LiveSessionEnvelope<TEvent> = {
  version: 1
  runId: string
  sequence: number
  emittedAt: string
  event: TEvent
}
