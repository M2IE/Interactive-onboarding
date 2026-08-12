import type { ElementDescriptor } from '@interactive-onboarding/element-selector'
import type { OnboardingStep } from '@m2ie/onboarding-sdk'

export type TabContext = {
  tabId: number
  origin: string
  pathname: string
  title: string
  url: string
}

export type PreviewConfig = {
  projectKey: string
  pageUrl: string
  steps: Array<
    Pick<OnboardingStep, 'id' | 'selector' | 'title' | 'body' | 'order'>
  >
}

export type ExtensionMessage =
  | { type: 'PICKER_START' }
  | { type: 'PICKER_CANCEL' }
  | { type: 'ELEMENT_SELECTED'; element: ElementDescriptor }
  | { type: 'PREVIEW_START'; config: PreviewConfig }
  | { type: 'PREVIEW_STOP' }
  | { type: 'PAGE_CHANGED'; pathname: string; title: string }
  | { type: 'TARGET_NOT_FOUND'; selector: string }
  | { type: 'GET_ACTIVE_TAB_CONTEXT' }
  | { type: 'CONTENT_READY' }

export type ActiveTabContextResponse =
  | { status: 'ready'; context: TabContext }
  | { status: 'unsupported'; message: string }
