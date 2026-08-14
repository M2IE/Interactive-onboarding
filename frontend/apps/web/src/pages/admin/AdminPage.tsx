import { lazy, Suspense } from 'react'
import { Button } from '@interactive-onboarding/ui'
import {
  BarChart3,
  BookOpenCheck,
  EyeOff,
  MonitorPlay,
  Plus,
  Route as RouteIcon,
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
import { ProductLogo } from '@/shared/ui/ProductLogo'
import type { ApiMode } from '@/shared/config/appConfig'

type AdminPageProps = {
  apiMode: ApiMode
}

const JourneyPage = lazy(() => import('./JourneyPage'))

export function AdminPage({ apiMode }: AdminPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAnalytics = location.pathname === appRoutes.adminAnalytics
  const isJourney = location.pathname === appRoutes.adminJourney
  const isScenarios = !isAnalytics && !isJourney
  const requestedScenarioId = new URLSearchParams(location.search).get(
    'scenarioId',
  )
  const editor = useScenarioEditor(requestedScenarioId, isScenarios)
  const analytics = useScenarioAnalytics(isAnalytics)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <ProductLogo subtitle="Admin Panel" />
        </div>

        <nav aria-label="Разделы админки">
          <Link className={isScenarios ? 'is-active' : undefined} to={appRoutes.admin}>
            <BookOpenCheck aria-hidden="true" size={19} />
            <span>Сценарии</span>
          </Link>
          <Link
            className={isJourney ? 'is-active' : undefined}
            to={appRoutes.adminJourney}
          >
            <RouteIcon aria-hidden="true" size={19} />
            <span>Journey Map</span>
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
          <h1>
            {isAnalytics
              ? 'Аналитика прохождения'
              : isJourney
                ? 'Journey Map'
                : 'Фабрика сценариев'}
          </h1>
          {!isJourney && <div
            className={`admin-topbar__actions${!isScenarios ? ' is-compact' : ''}`}
          >
            {isScenarios && <ScenarioGuideDialog />}
            {isAnalytics ? (
              <Button
                icon={<RefreshCw aria-hidden="true" size={17} />}
                onClick={analytics.refreshAnalytics}
                variant="ghost"
              >
                Обновить
              </Button>
            ) : isScenarios ? (
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
            ) : null}
            {isScenarios && (
              <Button
                disabled={editor.isBusy}
                icon={<Plus aria-hidden="true" size={18} />}
                onClick={editor.createDraft}
              >
                Создать сценарий
              </Button>
            )}
            {isScenarios && (
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
            {isScenarios && editor.hasPublishedVersion && (
                <Button
                  disabled={editor.isBusy}
                  icon={<EyeOff aria-hidden="true" size={17} />}
                  onClick={editor.unpublishActiveScenario}
                  variant="danger"
                >
                  Снять с публикации
                </Button>
            )}
            {isScenarios && !editor.isPublished && !editor.isArchived && (
                <Button
                  disabled={
                    editor.isBusy || editor.validation?.status === 'invalid'
                  }
                  icon={<Send aria-hidden="true" size={17} />}
                  onClick={editor.publishActiveScenario}
                  variant="primary"
                >
                  {editor.hasPublishedVersion
                    ? 'Обновить публикацию'
                    : 'Опубликовать'}
                </Button>
            )}
          </div>}
        </header>

        {isScenarios && editor.deepLinkNotice && (
          <div className="admin-inline-notice" role="status">
            {editor.deepLinkNotice}
          </div>
        )}

        {isJourney ? (
          <Suspense fallback={<section className="editor-state" aria-live="polite"><h2>Открываем Journey Map</h2><p>Загружаем интерактивное полотно.</p></section>}>
            <JourneyPage />
          </Suspense>
        ) : isAnalytics ? (
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
            scenarioGroups={editor.scenarioGroups}
            readOnly={editor.isReadOnly}
            showExtendedFields={apiMode === 'mock'}
            validation={editor.validation}
            onAddStep={editor.addStep}
            onDeleteStep={editor.deleteActiveStep}
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
