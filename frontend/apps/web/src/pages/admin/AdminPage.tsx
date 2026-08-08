import { Button } from '@interactive-onboarding/ui'
import {
  BarChart3,
  BookOpenCheck,
  MonitorPlay,
  Plus,
  RotateCcw,
  Send,
  UserRound,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ScenarioAnalytics,
  useScenarioAnalytics,
} from '@/features/scenario-analytics'
import { ScenarioEditor, useScenarioEditor } from '@/features/scenario-editor'
import { appRoutes } from '@/shared/config/routes'
import { AvitoLogo } from '@/shared/ui/AvitoLogo'

export function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAnalytics = location.pathname === appRoutes.adminAnalytics
  const editor = useScenarioEditor()
  const analytics = useScenarioAnalytics(editor.activeScenario)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <AvitoLogo />
          <span>Onboarding</span>
        </div>

        <nav aria-label="Разделы админки">
          <Link className={!isAnalytics ? 'is-active' : undefined} to={appRoutes.admin}>
            <BookOpenCheck aria-hidden="true" size={19} />
            <span>Сценарии</span>
          </Link>
          <Link
            className={isAnalytics ? 'is-active' : undefined}
            to={appRoutes.adminAnalytics}
          >
            <BarChart3 aria-hidden="true" size={19} />
            <span>Аналитика</span>
          </Link>
          <Link to={appRoutes.demo.profile}>
            <MonitorPlay aria-hidden="true" size={19} />
            <span>Демо сайт</span>
          </Link>
        </nav>

        <div className="admin-sidebar__profile">
          <span aria-hidden="true">
            <UserRound size={18} />
          </span>
          <div>
            <strong>Администратор</strong>
            <small>Product team</small>
          </div>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <h1>{isAnalytics ? 'Аналитика прохождения' : 'Фабрика сценариев'}</h1>
          <div
            className={`admin-topbar__actions${isAnalytics ? ' is-compact' : ''}`}
          >
            <Button
              icon={<RotateCcw aria-hidden="true" size={17} />}
              onClick={editor.restoreDemoScenario}
              variant="ghost"
            >
              Сбросить
            </Button>
            {!isAnalytics && (
              <Button
                icon={<Plus aria-hidden="true" size={18} />}
                onClick={editor.createDraft}
              >
                Создать сценарий
              </Button>
            )}
            {!isAnalytics && (
              <Button
                icon={<Send aria-hidden="true" size={17} />}
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
            onOpenDemo={() =>
              navigate(editor.activeScenario?.url ?? appRoutes.demo.profile)
            }
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
