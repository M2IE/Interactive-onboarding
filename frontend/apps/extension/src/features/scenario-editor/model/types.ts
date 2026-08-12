import type { ScenarioDraft } from '../../../entities/draft/model/types'
import type {
  ExtensionSettings,
  SettingsForm,
} from '../../../entities/settings/model/types'
import type { TabContext } from '../../../shared/messages/types'

export type SaveState =
  | { status: 'clean' }
  | { status: 'dirty' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'error'; message: string }

export type EditorInteraction =
  | { status: 'idle' }
  | { status: 'picking'; mode: 'new' | 'retarget'; stepId?: string }
  | { status: 'previewing'; scope: 'step' | 'scenario' }
  | { status: 'waiting_navigation'; stepId: string }

export type ReadyWorkspace = {
  status: 'ready'
  settings: ExtensionSettings
  context: TabContext
  draft: ScenarioDraft
  selectedStepId?: string
  hasPublishedScenario: boolean
  save: SaveState
  interaction: EditorInteraction
  routeChange?: TabContext
  runtimeNotice?: string
}

export type WorkspaceState =
  | { status: 'booting' }
  | {
      status: 'setup'
      context?: TabContext
      form: SettingsForm
      previousSettings?: ExtensionSettings
      error?: string
    }
  | { status: 'loading'; settings: ExtensionSettings; context: TabContext }
  | {
      status: 'empty'
      settings: ExtensionSettings
      context: TabContext
      projectId: string
      hasPublishedScenario: boolean
    }
  | { status: 'unsupported'; message: string }
  | {
      status: 'error'
      message: string
      settings?: ExtensionSettings
      context?: TabContext
    }
  | {
      status: 'conflict'
      settings: ExtensionSettings
      context: TabContext
      localDraft: ScenarioDraft
      remoteDraft?: ScenarioDraft
      projectId: string
      hasPublishedScenario: boolean
      message: string
    }
  | ReadyWorkspace

export type TabWorkspaceSnapshot = {
  settings: ExtensionSettings
  draft: ScenarioDraft
  selectedStepId?: string
  interaction: Extract<
    EditorInteraction,
    { status: 'idle' | 'picking' | 'waiting_navigation' }
  >
  save: SaveState
  hasPublishedScenario: boolean
}
