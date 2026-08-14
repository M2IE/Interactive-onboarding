import { Button } from "@interactive-onboarding/ui";
import {
  BarChart3,
  Code2,
  ExternalLink,
  MousePointer2,
  PackageOpen,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import extensionDemoVideo from "@/assets/extension-demo.webm";
import { ExtensionInstallGuideDialog } from "@/features/extension-install-guide";
import { appRoutes } from "@/shared/config/routes";
import { ProductLogo } from "@/shared/ui/ProductLogo";

const productStages = [
  {
    icon: MousePointer2,
    title: "Создайте сценарий",
    text: "Выберите нужные элементы, добавьте подсказки и свяжите страницы пользовательского пути.",
  },
  {
    icon: Code2,
    title: "Подключите SDK",
    text: "Опубликованные сценарии появляются в продукте без выпуска новой версии интерфейса.",
  },
  {
    icon: BarChart3,
    title: "Оцените результат",
    text: "Просмотры, завершения и воронка шагов показывают, где пользователю всё ещё нужна помощь.",
  },
];

export function AppShell() {
  const navigate = useNavigate();

  return (
    <main className="home-shell">
      <nav className="home-shell__nav" aria-label="Главная навигация">
        <ProductLogo />
        <div>
          <Link to={appRoutes.admin}>Админ-панель</Link>
          <Link to={appRoutes.demo.profile}>Демо</Link>
        </div>
      </nav>

      <section className="home-shell__hero">
        <div className="home-shell__intro">
          <h1>Помогайте пользователям двигаться дальше</h1>
          <p>
            Interactive Onboarding превращает сложные интерфейсы в понятные
            пошаговые маршруты. Команда управляет подсказками из админ-панели, а
            лёгкий SDK показывает их прямо внутри продукта.
          </p>
          <div className="home-shell__actions">
            <Button onClick={() => navigate(appRoutes.admin)} variant="primary">
              Создать сценарий
            </Button>
            <Button
              onClick={() => navigate(appRoutes.demo.profile)}
              variant="secondary"
            >
              Посмотреть демо
            </Button>
          </div>

          <a
            className="home-sdk-link"
            href="https://www.npmjs.com/package/@m2ie/onboarding-sdk"
            rel="noreferrer"
            target="_blank"
          >
            <PackageOpen aria-hidden="true" size={20} />
            <span>
              <small>Публичный SDK в npm</small>
              <strong>@m2ie/onboarding-sdk</strong>
            </span>
            <ExternalLink aria-hidden="true" size={17} />
          </a>

          <ol className="home-shell__stages">
            {productStages.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon aria-hidden="true" size={19} />
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div
          className="home-motion"
          aria-label="Сценарий ведёт пользователя от элемента к результату"
        >
          <div className="home-motion__orbit" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="home-motion__target">
            <span>Целевой элемент</span>
            <strong>Разместить объявление</strong>
          </div>
          <div className="home-motion__tooltip">
            <small>Шаг 1 из 4</small>
            <strong>Начните с первого объявления</strong>
            <span>Мы подскажем, что заполнить на каждом этапе.</span>
            <button type="button" tabIndex={-1}>
              Далее
            </button>
          </div>
          <div className="home-motion__status">
            <span aria-hidden="true" />
            Сценарий опубликован
          </div>
        </div>
      </section>

      <section className="home-extension" aria-labelledby="extension-title">
        <div className="home-extension__content">
          <small>Chrome Side Panel</small>
          <h2 id="extension-title">Создавайте подсказки прямо на сайте</h2>
          <p>
            Onboarding Studio превращает открытую страницу в рабочий холст:
            выберите подготовленный элемент, настройте текст, проверьте
            подсказку и сохраните черновик в админ-панель.
          </p>
          <ul>
            <li>Интерактивный выбор элементов</li>
            <li>Предпросмотр прямо на сайте</li>
            <li>Сохранение черновиков в проект</li>
            <li>Синхронизация с админ-панелью</li>
          </ul>
          <div className="home-extension__actions">
            <ExtensionInstallGuideDialog />
            <a
              href="https://github.com/M2IE/Interactive-onboarding/tree/main/frontend/apps/extension"
              rel="noreferrer"
              target="_blank"
            >
              Исходный код
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </div>
        </div>

        <figure className="home-extension__demo">
          <video autoPlay controls loop muted playsInline preload="metadata">
            <source src={extensionDemoVideo} type="video/webm" />
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
          <figcaption>
            Выбор элемента и создание подсказки в Onboarding Studio
          </figcaption>
        </figure>
      </section>
    </main>
  );
}
