import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './admin.css'
import { App } from './app/App'
import { AppProviders } from './app/providers/AppProviders'
import { createAppServices } from './app/services/createAppServices'
import { createAppStore } from './app/store/store'
import { createAppConfig } from './shared/config/appConfig'

const config = createAppConfig({
  VITE_API_MODE: import.meta.env.VITE_API_MODE,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ANALYTICS_ENABLED_HOSTS: import.meta.env.VITE_ANALYTICS_ENABLED_HOSTS,
  VITE_ONBOARDING_PROJECT_KEY: import.meta.env.VITE_ONBOARDING_PROJECT_KEY,
  VITE_ONBOARDING_PROJECT_ID: import.meta.env.VITE_ONBOARDING_PROJECT_ID,
}, { hostname: window.location.hostname })
const services = createAppServices(config)
const store = createAppStore(services)
const router = createBrowserRouter([
  {
    path: '*',
    element: <App services={services} />,
  },
])

createRoot(document.getElementById('root')!).render(
  <AppProviders store={store}>
    <RouterProvider router={router} />
  </AppProviders>,
)
