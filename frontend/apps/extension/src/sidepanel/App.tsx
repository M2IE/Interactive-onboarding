import { ExtensionScenarioEditor } from '../features/scenario-editor/ui/ExtensionScenarioEditor'
import { useExtensionScenarioEditor } from '../features/scenario-editor/hooks/useExtensionScenarioEditor'

export function App() {
  const controller = useExtensionScenarioEditor()

  return <ExtensionScenarioEditor controller={controller} />
}
