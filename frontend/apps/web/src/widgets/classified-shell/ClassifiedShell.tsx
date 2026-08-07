import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { appRoutes } from '@/shared/config/routes'
import { AvitoLogo } from '@/shared/ui/AvitoLogo'

type ClassifiedShellProps = {
  children: ReactNode
}

export function ClassifiedShell({ children }: ClassifiedShellProps) {
  return (
    <div className="classified-shell">
      <header className="classified-header">
        <div className="classified-header__top">
          <Link to={appRoutes.admin}>Админка</Link>
          <Link to={appRoutes.demo.profile}>Мои объявления</Link>
          <span>Помощь</span>
          <span>Каталоги</span>
        </div>
        <div className="classified-header__main">
          <AvitoLogo />
          <nav aria-label="Разделы классифайда">
            <Link to={appRoutes.demo.profile}>Бизнес360</Link>
            <Link to={appRoutes.demo.transport}>Авто</Link>
            <Link to={appRoutes.demo.newListing}>Недвижимость</Link>
            <Link to={appRoutes.demo.newListing}>Работа</Link>
            <Link to={appRoutes.demo.newListing}>Услуги</Link>
          </nav>
          <Link
            className="classified-header__create"
            to={appRoutes.demo.newListing}
          >
            + Разместить объявление
          </Link>
        </div>
      </header>
      {children}
      <footer className="classified-footer">
        <span>Помощь</span>
        <span>Безопасность</span>
        <span>Реклама на сайте</span>
        <span>О компании</span>
        <span>Авито Журнал</span>
        <span>#яПомогаю</span>
      </footer>
    </div>
  )
}
