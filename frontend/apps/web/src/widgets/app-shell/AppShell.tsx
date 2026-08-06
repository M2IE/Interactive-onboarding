import { Button, Panel } from "@interactive-onboarding/ui";
import { AvitoLogo } from "@/shared/ui/AvitoLogo";

export function AppShell() {
  return (
    <main className="home-shell">
      <nav className="home-shell__nav" aria-label="Главная навигация">
        <AvitoLogo />
        <div>
          <a href="/admin">Админка</a>
          <a href="/demo/profile">Демо классифайда</a>
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
            <a href="/admin">
              <Button variant="primary">Открыть админку</Button>
            </a>
            <a href="/demo/profile">
              <Button variant="secondary">Проверить сценарий</Button>
            </a>
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
