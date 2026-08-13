import type {
  ElementDescriptor,
  SelectorConfidence,
} from '@interactive-onboarding/element-selector'

export type StepDraft = {
  id: string
  persisted: boolean
  order: number
  selector: string
  title: string
  body: string
  nextUrl?: string
  target?: Pick<ElementDescriptor, 'tagName' | 'role' | 'label' | 'warnings'> & {
    confidence: SelectorConfidence
    matchCount: number
  }
}

export type ScenarioDraft = {
  id?: string
  projectId: string
  name: string
  url: string
  steps: StepDraft[]
}

export type PageDraftResult = {
  projectId: string
  draft?: ScenarioDraft
  hasPublishedScenario: boolean
}
