import { Button } from '@interactive-onboarding/ui'
import {
  BarChart3,
  BookOpenCheck,
  EyeOff,
  MonitorPlay,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  UserRound,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ScenarioAnalytics,
  useScenarioAnalytics,
} from '@/features/scenario-analytics'
import { ScenarioEditor, useScenarioEditor } from '@/features/scenario-editor'
import { ScenarioGuideDialog } from '@/features/scenario-guide'
import { appRoutes } from '@/shared/config/routes'
import { AvitoLogo } from '@/shared/ui/AvitoLogo'
import type { ApiMode } from '@/shared/config/appConfig'

type AdminPageProps = {
  apiMode: ApiMode
}

export function AdminPage({ apiMode }: AdminPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAnalytics = location.pathname === appRoutes.adminAnalytics
  const requestedScenarioId = new URLSearchParams(location.search).get(
    'scenarioId',
  )
  const editor = useScenarioEditor(requestedScenarioId)
  const analytics = useScenarioAnalytics()

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
            {!isAnalytics && <ScenarioGuideDialog />}
            {isAnalytics ? (
              <Button
                icon={<RefreshCw aria-hidden="true" size={17} />}
                onClick={analytics.refreshAnalytics}
                variant="ghost"
              >
                Обновить
              </Button>
            ) : (
              <Button
                disabled={editor.isBusy}
                icon={
                  apiMode === 'mock' ? (
                    <RotateCcw aria-hidden="true" size={17} />
                  ) : (
                    <RefreshCw aria-hidden="true" size={17} />
                  )
                }
                onClick={editor.reloadScenarios}
                variant="ghost"
              >
                {apiMode === 'mock' ? 'Сбросить' : 'Обновить'}
              </Button>
            )}
            {!isAnalytics && (
              <Button
                disabled={editor.isBusy}
                icon={<Plus aria-hidden="true" size={18} />}
                onClick={editor.createDraft}
              >
                Создать сценарий
              </Button>
            )}
            {!isAnalytics && (
              <Button
                disabled={
                  editor.isBusy || editor.isReadOnly || !editor.isDirty
                }
                icon={<Save aria-hidden="true" size={17} />}
                onClick={editor.saveActiveScenario}
                variant="secondary"
              >
                Сохранить
              </Button>
            )}
            {!isAnalytics &&
              (editor.isPublished ? (
                <Button
                  disabled={editor.isBusy}
                  icon={<EyeOff aria-hidden="true" size={17} />}
                  onClick={editor.unpublishActiveScenario}
                  variant="danger"
                >
                  Снять с публикации
                </Button>
              ) : !editor.isArchived ? (
                <Button
                  disabled={
                    editor.isBusy || editor.validation?.status === 'invalid'
                  }
                  icon={<Send aria-hidden="true" size={17} />}
                  onClick={editor.publishActiveScenario}
                  variant="primary"
                >
                  Опубликовать
                </Button>
              ) : null)}
          </div>
        </header>

        {!isAnalytics && editor.deepLinkNotice && (
          <div className="admin-inline-notice" role="status">
            {editor.deepLinkNotice}
          </div>
        )}

        {isAnalytics ? (
          <ScenarioAnalytics
            reportState={analytics.reportState}
            source={analytics.source}
            workspace={analytics.workspace}
            onDownloadReport={analytics.downloadReport}
            onResetAnalytics={analytics.resetAnalytics}
            onRetry={analytics.refreshAnalytics}
            onSelectScenario={analytics.selectScenario}
          />
        ) : editor.workflow.status === 'loading' && !editor.activeScenario ? (
          <section className="editor-state" aria-live="polite">
            <h2>Загружаем сценарии</h2>
            <p>Получаем актуальные настройки и шаги из API.</p>
          </section>
        ) : editor.workflow.status === 'error' ? (
          <section className="editor-state editor-state--error" role="alert">
            <h2>Не удалось загрузить конструктор</h2>
            <p>{editor.workflow.message}</p>
            <Button onClick={editor.reloadScenarios}>Повторить</Button>
          </section>
        ) : !editor.activeScenario ? (
          <section className="editor-state">
            <h2>Сценариев пока нет</h2>
            <p>Создайте первую точку входа и настройте шаги онбординга.</p>
          </section>
        ) : (
          <ScenarioEditor
            activeScenario={editor.activeScenario}
            activeStep={editor.activeStep}
            scenarios={editor.scenarios}
            readOnly={editor.isReadOnly}
            showExtendedFields={apiMode === 'mock'}
            validation={editor.validation}
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
