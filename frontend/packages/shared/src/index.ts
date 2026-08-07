export type ScenarioStatus = 'draft' | 'published' | 'archived'

export type StepPlacement = 'top' | 'right' | 'bottom' | 'left'

export type StepCompletionMode = 'next_button' | 'target_click' | 'navigate'

export type OnboardingEventType =
  | 'scenario_started'
  | 'step_viewed'
  | 'step_completed'
  | 'scenario_completed'
  | 'scenario_dismissed'
  | 'target_not_found'

export type PageDefinition = {
  id: string
  projectId: string
  name: string
  description: string
  path: string
  type: 'prod' | 'dev' | 'test'
}

export type OnboardingStep = {
  id: string
  versionId: string
  pageId: string
  pagePath: string
  order: number
  selector: string
  title: string
  body: string
  placement: StepPlacement
  completion: StepCompletionMode
  nextUrl?: string
  showOnce?: boolean
  condition?: string
}

export type OnboardingScenario = {
  id: string
  projectId: string
  projectKey: string
  flowKey: string
  name: string
  description: string
  status: ScenarioStatus
  version: number
  versionId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  pages: PageDefinition[]
  steps: OnboardingStep[]
}

export type WidgetConfigRequest = {
  projectKey: string
  pageUrl: string
  userId?: string
  sessionId: string
}

export type WidgetConfig = {
  projectKey: string
  flowKey: string
  scenarioId: string
  scenarioName: string
  version: number
  versionId: string
  pagePath: string
  totalSteps: number
  steps: OnboardingStep[]
}

export type OnboardingEventPayload = {
  projectKey: string
  scenarioId: string
  versionId: string
  stepId?: string
  sessionId: string
  userId?: string
  type: OnboardingEventType
  eventKey: string
  pageUrl: string
  createdAt: string
}

export type OnboardingApiClient = {
  getConfig: (request: WidgetConfigRequest) => Promise<WidgetConfig | null>
  trackEvent: (event: OnboardingEventPayload) => Promise<void>
}

export type AnalyticsSummary = {
  started: number
  completed: number
  dismissed: number
  completionRate: number
  targetMisses: number
}
