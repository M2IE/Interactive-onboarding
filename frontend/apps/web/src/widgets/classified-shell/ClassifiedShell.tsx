import type { ReactNode } from 'react'
import { AvitoLogo } from '@/shared/ui/AvitoLogo'

type ClassifiedShellProps = {
  children: ReactNode
}

export function ClassifiedShell({ children }: ClassifiedShellProps) {
  return (
    <div className="classified-shell">
      <header className="classified-header">
        <div className="classified-header__top">
          <a href="/admin">Админка</a>
          <a href="/demo/profile">Мои объявления</a>
          <span>Помощь</span>
          <span>Каталоги</span>
        </div>
        <div className="classified-header__main">
          <AvitoLogo />
          <nav aria-label="Разделы классифайда">
            <a href="/demo/profile">Бизнес360</a>
            <a href="/demo/new/transport">Авто</a>
            <a href="/demo/new">Недвижимость</a>
            <a href="/demo/new">Работа</a>
            <a href="/demo/new">Услуги</a>
          </nav>
          <a className="classified-header__create" href="/demo/new">
            + Разместить объявление
          </a>
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
