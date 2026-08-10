export type ApiMode = 'real' | 'mock'

export type AppConfig = {
  apiMode: ApiMode
  apiBaseUrl: string
  projectKey: string
  projectId?: string
}

type AppEnvironment = {
  VITE_API_MODE?: string
  VITE_API_BASE_URL?: string
  VITE_ONBOARDING_PROJECT_KEY?: string
  VITE_ONBOARDING_PROJECT_ID?: string
}

export function createAppConfig(environment: AppEnvironment): AppConfig {
  const apiMode = environment.VITE_API_MODE === 'mock' ? 'mock' : 'real'
  const projectId = environment.VITE_ONBOARDING_PROJECT_ID?.trim()

  return {
    apiMode,
    apiBaseUrl: environment.VITE_API_BASE_URL?.trim() || '/api/v1',
    projectKey:
      environment.VITE_ONBOARDING_PROJECT_KEY?.trim() ||
      (apiMode === 'mock' ? 'avito-demo' : 'interactive-onboarding'),
    projectId: projectId || undefined,
  }
}
