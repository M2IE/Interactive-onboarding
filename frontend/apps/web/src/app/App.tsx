import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from "@/pages/admin/AdminPage";
import { DemoPage } from "@/pages/demo/DemoPage";
import { appRoutes } from '@/shared/config/routes'
import { AppShell } from "@/widgets/app-shell/AppShell";
import type { AppServices } from './services/createAppServices'

type AppProps = {
  services: AppServices
}

export function App({ services }: AppProps) {
  return (
    <Routes>
      <Route element={<AppShell />} path={appRoutes.home} />
      <Route
        element={<AdminPage apiMode={services.apiMode} />}
        path="/admin/*"
      />
      <Route
        element={
          <DemoPage
            analyticsEnabled={services.analyticsEnabled}
            onboardingClient={services.onboardingClient}
            projectKey={services.projectKey}
          />
        }
        path="/demo/*"
      />
      <Route element={<Navigate replace to={appRoutes.home} />} path="*" />
    </Routes>
  )
}
