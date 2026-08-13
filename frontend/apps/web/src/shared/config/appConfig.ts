export type ApiMode = 'real' | 'mock'

export type AppConfig = {
  apiMode: ApiMode
  apiBaseUrl: string
  analyticsEnabled: boolean
  projectKey: string
  projectId?: string
}

type AppEnvironment = {
  VITE_API_MODE?: string
  VITE_API_BASE_URL?: string
  VITE_ANALYTICS_ENABLED_HOSTS?: string
  VITE_ONBOARDING_PROJECT_KEY?: string
  VITE_ONBOARDING_PROJECT_ID?: string
}

type AppRuntime = {
  hostname?: string
}

const DEFAULT_ANALYTICS_ENABLED_HOSTS = 'demo.m2ie.ru'

export function createAppConfig(
  environment: AppEnvironment,
  runtime: AppRuntime = {},
): AppConfig {
  const apiMode = environment.VITE_API_MODE === 'mock' ? 'mock' : 'real'
  const projectId = environment.VITE_ONBOARDING_PROJECT_ID?.trim()
  const analyticsEnabledHosts = parseHostList(
    environment.VITE_ANALYTICS_ENABLED_HOSTS ?? DEFAULT_ANALYTICS_ENABLED_HOSTS,
  )

  return {
    apiMode,
    apiBaseUrl: environment.VITE_API_BASE_URL?.trim() || '/api/v1',
    analyticsEnabled:
      apiMode === 'mock' || analyticsEnabledHosts.has(normalizeHostname(runtime.hostname)),
    projectKey:
      environment.VITE_ONBOARDING_PROJECT_KEY?.trim() ||
      (apiMode === 'mock' ? 'avito-demo' : 'interactive-onboarding'),
    projectId: projectId || undefined,
  }
}

function parseHostList(value: string) {
  return new Set(
    value
      .split(',')
      .map(normalizeHostname)
      .filter(Boolean),
  )
}

function normalizeHostname(value?: string) {
  return value?.trim().toLowerCase().replace(/\.$/, '') ?? ''
}
