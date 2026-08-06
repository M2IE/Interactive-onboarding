import { OnboardingProvider } from "@interactive-onboarding/onboarding-sdk/react";
import { ClassifiedShell } from "@/widgets/classified-shell/ClassifiedShell";
import { mockOnboardingClient } from "@/shared/api/mockOnboardingApi";
import { useCurrentPath } from "@/shared/hooks/useCurrentPath";

export function DemoPage() {
  const path = useCurrentPath();

  return (
    <>
      <ClassifiedShell>
        {path === "/demo/profile" && <ProfileScreen />}
        {path === "/demo/new" && <CategoryScreen />}
        {path === "/demo/new/transport" && <TransportScreen />}
        {path === "/demo/new/auto" && <AutoFormScreen />}
      </ClassifiedShell>

      <OnboardingProvider
        apiClient={mockOnboardingClient}
        pageUrl={path}
        projectKey="avito-demo"
        userId="demo-user-1"
      />
    </>
  );
}

function ProfileScreen() {
  return (
    <main className="classified-page classified-page--profile">
      <aside className="profile-sidebar">
        <div className="profile-avatar">E</div>
        <h1>EL</h1>
        <p>
          <strong>0,0</strong> Нет отзывов
        </p>
        <nav aria-label="Разделы профиля">
          <a href="/demo/profile">Мои объявления</a>
          <a href="/demo/profile">Заказы</a>
          <a href="/demo/profile">Избранное</a>
          <a href="/demo/profile">Сообщения</a>
          <a href="/demo/profile">Кошелек</a>
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
          <a
            className="avito-button avito-button--dark"
            data-onboarding-id="profile-create-button"
            href="/demo/new"
          >
            Разместить объявление
          </a>
        </div>
      </section>
    </main>
  );
}

function CategoryScreen() {
  const categories = [
    ["Транспорт", "/demo/new/transport", "category-transport"],
    ["Недвижимость", "/demo/new", "category-real-estate"],
    ["Работа", "/demo/new", "category-job"],
    ["Услуги", "/demo/new", "category-services"],
    ["Личные вещи", "/demo/new", "category-personal"],
    ["Для дома и дачи", "/demo/new", "category-home"],
    ["Электроника", "/demo/new", "category-electronics"],
    ["Хобби и отдых", "/demo/new", "category-hobby"],
    ["Животные", "/demo/new", "category-pets"],
    ["Готовый бизнес и оборудование", "/demo/new", "category-business"],
  ] as const;

  return (
    <main className="classified-page classified-page--narrow">
      <h1>Новое объявление</h1>
      <div className="category-list">
        {categories.map(([label, href, onboardingId]) => (
          <a data-onboarding-id={onboardingId} href={href} key={label}>
            <span>{label}</span>
            <span aria-hidden="true">›</span>
          </a>
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
          <a className="is-selected" href="/demo/new/transport">
            <span>Транспорт</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new">
            <span>Недвижимость</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new">
            <span>Работа</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new">
            <span>Услуги</span>
            <span aria-hidden="true">›</span>
          </a>
        </div>
        <div className="category-list">
          <a className="is-selected" href="/demo/new/transport">
            <span>Автомобили</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new/transport">
            <span>Мотоциклы и мототехника</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new/transport">
            <span>Грузовики и спецтехника</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new/transport">
            <span>Запчасти и аксессуары</span>
            <span aria-hidden="true">›</span>
          </a>
        </div>
        <div className="category-list">
          <a
            className="is-selected"
            data-onboarding-id="transport-used-car"
            href="/demo/new/auto"
          >
            <span>С пробегом</span>
            <span aria-hidden="true">›</span>
          </a>
          <a href="/demo/new/auto">
            <span>Новый</span>
            <span aria-hidden="true">›</span>
          </a>
        </div>
      </div>
    </main>
  );
}

function AutoFormScreen() {
  return (
    <main className="classified-page classified-page--form">
      <a className="back-link" href="/demo/new/transport">
        ←
      </a>
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
        <input defaultValue="8 912 583-99-19" />
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
