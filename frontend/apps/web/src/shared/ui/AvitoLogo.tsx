import { Link } from 'react-router-dom'
import { appRoutes } from '@/shared/config/routes'

export function AvitoLogo() {
  return (
    <Link
      aria-label="Avito Onboarding Lab"
      className="avito-logo"
      to={appRoutes.home}
    >
      <span className="avito-logo__mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>Avito</span>
    </Link>
  )
}
