import { describe, expect, it } from '@jest/globals'
import { createAppConfig } from './appConfig'

describe('app API config', () => {
  it('uses the real backend by default without a hidden mock fallback', () => {
    expect(createAppConfig({}, { hostname: 'm2ie.ru' })).toEqual({
      apiMode: 'real',
      apiBaseUrl: '/api/v1',
      analyticsEnabled: false,
      projectKey: 'interactive-onboarding',
      projectId: undefined,
    })
  })

  it('enables the mock only when explicitly configured', () => {
    expect(createAppConfig({ VITE_API_MODE: 'mock' })).toMatchObject({
      apiMode: 'mock',
      analyticsEnabled: true,
      projectKey: 'avito-demo',
    })
  })

  it('enables persisted analytics only for an explicitly allowed hostname', () => {
    const environment = {
      VITE_ANALYTICS_ENABLED_HOSTS: 'demo.m2ie.ru, analytics.example.com',
    }

    expect(createAppConfig(environment, { hostname: 'demo.m2ie.ru' }).analyticsEnabled)
      .toBe(true)
    expect(createAppConfig(environment, { hostname: 'demo-test.m2ie.ru' }).analyticsEnabled)
      .toBe(false)
    expect(createAppConfig(environment, { hostname: 'ANALYTICS.EXAMPLE.COM.' }).analyticsEnabled)
      .toBe(true)
  })
})
