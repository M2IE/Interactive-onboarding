import { describe, expect, it } from '@jest/globals'
import { createAppConfig } from './appConfig'

describe('app API config', () => {
  it('uses the real backend by default without a hidden mock fallback', () => {
    expect(createAppConfig({})).toEqual({
      apiMode: 'real',
      apiBaseUrl: '/api/v1',
      projectKey: 'interactive-onboarding',
      projectId: undefined,
    })
  })

  it('enables the mock only when explicitly configured', () => {
    expect(createAppConfig({ VITE_API_MODE: 'mock' })).toMatchObject({
      apiMode: 'mock',
      projectKey: 'avito-demo',
    })
  })
})
