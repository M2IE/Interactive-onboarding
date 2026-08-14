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

export type OnboardingStep = {
  id: string
  versionId: string
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
  flowId?: string
  flowName?: string
  flowKey: string
  flowOrder: number
  name: string
  description: string
  url: string
  status: ScenarioStatus
  version: number
  versionId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
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
  flowId?: string
  flowKey: string
  flowOrder: number
  scenarioId: string
  scenarioName: string
  version: number
  versionId: string
  pageUrl: string
  stepOffset: number
  totalSteps: number
  previousPage?: WidgetFlowPage
  nextPage?: WidgetFlowPage
  steps: OnboardingStep[]
}

export type WidgetFlowPage = {
  scenarioId: string
  pageUrl: string
  flowOrder: number
  stepCount: number
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

export type OnboardingEventHandler = (event: OnboardingEventPayload) => void

export type OnboardingApiClient = {
  getConfig: (request: WidgetConfigRequest) => Promise<WidgetConfig | null>
  trackEvent: (event: OnboardingEventPayload) => Promise<void>
}

export type OnboardingEligibilityContext = {
  projectKey: string
  pageUrl: string
  sessionId: string
  userId?: string
}

export type OnboardingEligibility =
  | boolean
  | ((context: OnboardingEligibilityContext) => boolean | Promise<boolean>)
