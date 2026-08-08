import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from "@/pages/admin/AdminPage";
import { DemoPage } from "@/pages/demo/DemoPage";
import { appRoutes } from '@/shared/config/routes'
import { AppShell } from "@/widgets/app-shell/AppShell";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />} path={appRoutes.home} />
      <Route element={<AdminPage />} path="/admin/*" />
      <Route element={<DemoPage />} path="/demo/*" />
      <Route element={<Navigate replace to={appRoutes.home} />} path="*" />
    </Routes>
  )
}
