import { Button, Panel } from "@interactive-onboarding/ui";
import { Link, useNavigate } from 'react-router-dom'
import { appRoutes } from '@/shared/config/routes'
import { AvitoLogo } from "@/shared/ui/AvitoLogo";

export function AppShell() {
  const navigate = useNavigate()

  return (
    <main className="home-shell">
      <nav className="home-shell__nav" aria-label="Главная навигация">
        <AvitoLogo />
        <div>
          <Link to={appRoutes.admin}>Админка</Link>
          <Link to={appRoutes.demo.profile}>Демо классифайда</Link>
        </div>
      </nav>

      <section className="home-shell__hero">
        <div>
          <h1>Интерактивный онбординг для классифайда</h1>
          <p>
            Один фронтенд показывает весь MVP: админку для сценариев,
            подключаемый SDK-виджет и тестовый экран классифайда.
          </p>
          <div className="home-shell__actions">
            <Button
              onClick={() => navigate(appRoutes.admin)}
              variant="primary"
            >
              Открыть админку
            </Button>
            <Button
              onClick={() => navigate(appRoutes.demo.profile)}
              variant="secondary"
            >
              Проверить сценарий
            </Button>
          </div>
        </div>

        <Panel className="home-shell__panel" title="Что внутри">
          <ol className="home-shell__list">
            <li>Пакет `onboarding-sdk` с публичным методом подключения.</li>
            <li>Админка, где сценарий можно редактировать и публиковать.</li>
            <li>Демо Avito flow, который получает шаги из конфигурации.</li>
            <li>События прохождения и базовая аналитика по шагам.</li>
          </ol>
        </Panel>
      </section>
    </main>
  );
}
