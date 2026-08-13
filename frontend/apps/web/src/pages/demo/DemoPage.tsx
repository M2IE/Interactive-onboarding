import { OnboardingProvider } from "@m2ie/onboarding-sdk/react";
import type { OnboardingApiClient } from '@m2ie/onboarding-sdk'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ClassifiedShell } from "@/widgets/classified-shell/ClassifiedShell";
import { appRoutes } from '@/shared/config/routes'
import {
  DemoCompletionDialog,
  useDemoCompletion,
} from '@/features/demo-completion'
import { useLiveSessionPublisher } from '@/features/live-session'

type DemoPageProps = {
  onboardingClient: OnboardingApiClient
  projectKey: string
}

export function DemoPage({
  onboardingClient,
  projectKey,
}: DemoPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const completion = useDemoCompletion()
  const liveSessionId = new URLSearchParams(location.search).get('liveSession')
  const live = useLiveSessionPublisher(liveSessionId, onboardingClient)

  const navigateOnboarding = (url: string) => {
    if (!liveSessionId) {
      navigate(url)
      return
    }
    const destination = new URL(url, window.location.origin)
    destination.searchParams.set('liveSession', liveSessionId)
    navigate(`${destination.pathname}${destination.search}`)
  }

  return (
    <>
      <ClassifiedShell>
        <Routes>
          <Route element={<ProfileScreen />} path="profile" />
          <Route element={<CategoryScreen />} path="new" />
          <Route element={<TransportScreen />} path="new/transport" />
          <Route element={<AutoFormScreen />} path="new/auto" />
          <Route
            element={<Navigate replace to={appRoutes.demo.profile} />}
            path="*"
          />
        </Routes>
      </ClassifiedShell>

      <OnboardingProvider
        apiClient={live.onboardingClient}
        key={`${completion.runId}:${liveSessionId ?? 'standard'}`}
        navigate={navigateOnboarding}
        onComplete={liveSessionId ? undefined : completion.completeDemo}
        onEvent={liveSessionId ? live.onEvent : completion.handleOnboardingEvent}
        pageUrl={location.pathname}
        projectKey={projectKey}
      />
      <DemoCompletionDialog
        outcome={completion.outcome}
        onRepeat={completion.repeatDemo}
        onReturnHome={completion.returnHome}
      />
    </>
  );
}

function ProfileScreen() {
  return (
    <main className="classified-page classified-page--profile">
      <aside className="profile-sidebar">
        <div className="profile-avatar">МВ</div>
        <h1>Марина Волкова</h1>
        <p>
          <strong>0,0</strong> Нет отзывов
        </p>
        <nav aria-label="Разделы профиля">
          <Link to={appRoutes.demo.profile}>Мои объявления</Link>
          <Link to={appRoutes.demo.profile}>Заказы</Link>
          <Link to={appRoutes.demo.profile}>Избранное</Link>
          <Link to={appRoutes.demo.profile}>Сообщения</Link>
          <Link to={appRoutes.demo.profile}>Кошелек</Link>
        </nav>
      </aside>

      <section className="profile-empty">
        <div className="profile-banner">
          <span>Продавайте с примеркой</span>
          <button type="button">Подробнее</button>
        </div>
        <div className="profile-empty__content">
          <div className="empty-illustration">□</div>
          <h2>Объявлений пока нет</h2>
          <p>Но это легко исправить - разместите первое</p>
          <Link
            className="avito-button avito-button--dark"
            data-onboarding-id="profile-create-button"
            to={appRoutes.demo.newListing}
          >
            Разместить объявление
          </Link>
        </div>
      </section>
    </main>
  );
}

function CategoryScreen() {
  const categories = [
    ['Транспорт', appRoutes.demo.transport, 'category-transport'],
    ['Недвижимость', appRoutes.demo.newListing, 'category-real-estate'],
    ['Работа', appRoutes.demo.newListing, 'category-job'],
    ['Услуги', appRoutes.demo.newListing, 'category-services'],
    ['Личные вещи', appRoutes.demo.newListing, 'category-personal'],
    ['Для дома и дачи', appRoutes.demo.newListing, 'category-home'],
    ['Электроника', appRoutes.demo.newListing, 'category-electronics'],
    ['Хобби и отдых', appRoutes.demo.newListing, 'category-hobby'],
    ['Животные', appRoutes.demo.newListing, 'category-pets'],
    ['Готовый бизнес и оборудование', appRoutes.demo.newListing, 'category-business'],
  ] as const;

  return (
    <main className="classified-page classified-page--narrow">
      <h1>Новое объявление</h1>
      <div className="category-list">
        {categories.map(([label, href, onboardingId]) => (
          <Link data-onboarding-id={onboardingId} key={label} to={href}>
            <span>{label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function TransportScreen() {
  return (
    <main className="classified-page classified-page--wide">
      <h1>Новое объявление</h1>
      <div className="transport-grid">
        <div className="category-list">
          <Link className="is-selected" to={appRoutes.demo.transport}>
            <span>Транспорт</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.newListing}>
            <span>Недвижимость</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.newListing}>
            <span>Работа</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.newListing}>
            <span>Услуги</span>
            <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="category-list">
          <Link className="is-selected" to={appRoutes.demo.transport}>
            <span>Автомобили</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.transport}>
            <span>Мотоциклы и мототехника</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.transport}>
            <span>Грузовики и спецтехника</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.transport}>
            <span>Запчасти и аксессуары</span>
            <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="category-list">
          <Link
            className="is-selected"
            data-onboarding-id="transport-used-car"
            to={appRoutes.demo.auto}
          >
            <span>С пробегом</span>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to={appRoutes.demo.auto}>
            <span>Новый</span>
            <span aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

function AutoFormScreen() {
  return (
    <main className="classified-page classified-page--form">
      <Link className="back-link" to={appRoutes.demo.transport}>
        ←
      </Link>
      <div className="form-heading">
        <h1>Новое объявление</h1>
        <p>Транспорт · Автомобили · С пробегом</p>
      </div>

      <section className="form-section">
        <label>
          Вид объявления
          <select>
            <option>С пробегом</option>
          </select>
        </label>
      </section>

      <section className="form-section" data-onboarding-id="auto-photos">
        <h2>Покажите машину снаружи и внутри</h2>
        <p>
          Чем подробнее фотографии, тем быстрее покупатель решится на осмотр.
        </p>
        <div className="photo-uploader">▣</div>
      </section>

      <section
        className="form-section form-section--stack"
        data-onboarding-id="auto-details"
      >
        <h2>Регистрационные данные</h2>
        <label>
          VIN или номер кузова
          <input placeholder="Например, XTA..." />
        </label>
        <label>
          Государственный номер
          <input placeholder="А 000 АА" />
        </label>
        <h2>Технические характеристики</h2>
        <label>
          Марка
          <input placeholder="Выберите марку" />
        </label>
        <label>
          Пробег
          <input placeholder="0 км" />
        </label>
      </section>

      <section className="form-section form-section--stack">
        <h2>Описание</h2>
        <textarea placeholder="Расскажите о состоянии, обслуживании и особенностях авто" />
        <h2>Место осмотра</h2>
        <input placeholder="Начните вводить адрес" />
        <div className="demo-map">Карта района</div>
      </section>

      <section
        className="form-section form-section--stack"
        data-onboarding-id="auto-publish"
      >
        <h2>Цена</h2>
        <input placeholder="₽" />
        <h2>Контакты</h2>
        <input placeholder="Ваш email" />
        <input inputMode="tel" placeholder="Номер телефона" type="tel" />
        <div className="radio-list">
          <label>
            <input defaultChecked name="contact" type="radio" /> Звонки и
            сообщения
          </label>
          <label>
            <input name="contact" type="radio" /> Только звонки
          </label>
          <label>
            <input name="contact" type="radio" /> Только сообщения
          </label>
        </div>
        <div className="publish-actions">
          <button className="avito-button avito-button--dark" type="button">
            Разместить
          </button>
          <button className="avito-button" type="button">
            Сохранить и выйти
          </button>
        </div>
      </section>
    </main>
  );
}
