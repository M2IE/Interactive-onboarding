import { Button } from '@interactive-onboarding/ui'
import {
  ScenarioAnalytics,
  useScenarioAnalytics,
} from '@/features/scenario-analytics'
import { ScenarioEditor, useScenarioEditor } from '@/features/scenario-editor'
import { useCurrentPath } from '@/shared/hooks/useCurrentPath'
import { AvitoLogo } from '@/shared/ui/AvitoLogo'

export function AdminPage() {
  const path = useCurrentPath()
  const isAnalytics = path === '/admin/analytics'
  const editor = useScenarioEditor()
  const analytics = useScenarioAnalytics(editor.activeScenario)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <AvitoLogo />
        <nav aria-label="Разделы админки">
          <a className={!isAnalytics ? 'is-active' : undefined} href="/admin">
            Сценарии
          </a>
          <a
            className={isAnalytics ? 'is-active' : undefined}
            href="/admin/analytics"
          >
            Аналитика
          </a>
          <a href="/demo/profile">Демо сайт</a>
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <div>
            <p>Onboarding Control</p>
            <h1>
              {isAnalytics ? 'Аналитика прохождения' : 'Фабрика сценариев'}
            </h1>
          </div>
          <div className="admin-topbar__actions">
            <Button onClick={editor.restoreDemoScenario}>Сбросить демо</Button>
            {!isAnalytics && (
              <Button onClick={editor.createDraft}>Создать сценарий</Button>
            )}
            {!isAnalytics && (
              <Button
                onClick={editor.publishActiveScenario}
                variant="primary"
              >
                Опубликовать
              </Button>
            )}
          </div>
        </header>

        {isAnalytics ? (
          <ScenarioAnalytics
            events={analytics.events}
            funnel={analytics.funnel}
            reportState={analytics.reportState}
            summary={analytics.summary}
            onDownloadReport={analytics.downloadReport}
            onResetAnalytics={analytics.resetAnalytics}
          />
        ) : (
          <ScenarioEditor
            activeScenario={editor.activeScenario}
            activeStep={editor.activeStep}
            scenarios={editor.scenarios}
            workflow={editor.workflow}
            onAddStep={editor.addStep}
            onSelectScenario={editor.selectScenario}
            onSelectStep={editor.selectStep}
            onUpdateScenarioMeta={editor.updateScenarioMeta}
            onUpdateStep={editor.updateStep}
          />
        )}
      </main>
    </div>
  )
}
