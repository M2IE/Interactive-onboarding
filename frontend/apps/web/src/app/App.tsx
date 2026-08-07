import { AdminPage } from "@/pages/admin/AdminPage";
import { DemoPage } from "@/pages/demo/DemoPage";
import { useCurrentPath } from "@/shared/hooks/useCurrentPath";
import { AppShell } from "@/widgets/app-shell/AppShell";

export function App() {
  const path = useCurrentPath();

  if (path.startsWith("/demo")) {
    return <DemoPage />;
  }

  if (path.startsWith("/admin")) {
    return <AdminPage />;
  }

  return <AppShell />;
}
