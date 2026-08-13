import type { WidgetConfig, WidgetConfigRequest } from '../types/contracts'
import { clearLinearJourneyProgress } from '../core/session'
import { createLinearJourneyResolver } from './linearJourneyResolver'

const request: WidgetConfigRequest = {
  projectKey: 'avito-demo',
  pageUrl: '/profile',
  sessionId: 'session-1',
}

describe('linear journey resolver', () => {
  beforeEach(() => sessionStorage.clear())

  it('calculates total steps and offsets across page-local scenarios', async () => {
    const configs = new Map([
      ['/profile', createConfig('profile', '/profile', 1, '/new')],
      ['/new', createConfig('new', '/new', 1, '/transport')],
      ['/transport', createConfig('transport', '/transport', 1, '/auto')],
      ['/auto', createConfig('auto', '/auto', 3)],
    ])
    const loadConfig = jest.fn(async ({ pageUrl }: WidgetConfigRequest) =>
      configs.get(pageUrl) ?? null,
    )
    const resolve = createLinearJourneyResolver({ loadConfig })

    const profile = await resolve(request, configs.get('/profile')!)
    const transport = await resolve(
      { ...request, pageUrl: '/transport' },
      configs.get('/transport')!,
    )
    const auto = await resolve(
      { ...request, pageUrl: '/auto' },
      configs.get('/auto')!,
    )

    expect(profile).toMatchObject({ stepOffset: 0, totalSteps: 6 })
    expect(transport).toMatchObject({ stepOffset: 2, totalSteps: 6 })
    expect(auto).toMatchObject({ stepOffset: 3, totalSteps: 6 })
    expect(loadConfig).toHaveBeenCalledTimes(3)
  })

  it('falls back to page-local progress when preloading fails', async () => {
    const current = createConfig('profile', '/profile', 1, '/new')
    const resolve = createLinearJourneyResolver({
      loadConfig: jest.fn().mockRejectedValue(new Error('API unavailable')),
    })

    await expect(resolve(request, current)).resolves.toBe(current)
  })

  it('keeps page-local progress when a linked page has no published scenario', async () => {
    const current = createConfig('profile', '/profile', 1, '/missing')
    const resolve = createLinearJourneyResolver({
      loadConfig: jest.fn().mockResolvedValue(null),
    })

    await expect(resolve(request, current)).resolves.toBe(current)
    expect(sessionStorage.length).toBe(0)
  })

  it('stops cyclic paths and clears cached progress', async () => {
    const profile = createConfig('profile', '/profile', 1, '/new')
    const next = createConfig('new', '/new', 1, '/profile')
    const resolve = createLinearJourneyResolver({
      loadConfig: jest.fn(async ({ pageUrl }: WidgetConfigRequest) =>
        pageUrl === '/new' ? next : profile,
      ),
    })

    await expect(resolve(request, profile)).resolves.toBe(profile)

    const linear = createLinearJourneyResolver({
      loadConfig: jest.fn().mockResolvedValue(createConfig('end', '/new', 1)),
    })
    await linear(request, profile)
    expect(sessionStorage.length).toBe(1)
    clearLinearJourneyProgress()
    expect(sessionStorage.length).toBe(0)
  })

  it('keeps local progress for an ambiguous page transition', async () => {
    const current = createConfig('profile', '/profile', 2, '/new')
    current.steps[0] = { ...current.steps[0]!, nextUrl: '/alternative' }
    const loadConfig = jest.fn()
    const resolve = createLinearJourneyResolver({ loadConfig })

    await expect(resolve(request, current)).resolves.toBe(current)
    expect(loadConfig).not.toHaveBeenCalled()
  })
})

function createConfig(
  scenarioId: string,
  pageUrl: string,
  stepCount: number,
  nextUrl?: string,
): WidgetConfig {
  return {
    projectKey: request.projectKey,
    flowKey: scenarioId,
    scenarioId,
    scenarioName: scenarioId,
    version: 1,
    versionId: scenarioId,
    pageUrl,
    stepOffset: 0,
    totalSteps: stepCount,
    steps: Array.from({ length: stepCount }, (_, index) => ({
      id: `${scenarioId}-step-${index + 1}`,
      versionId: scenarioId,
      order: index + 1,
      selector: `#${scenarioId}-${index + 1}`,
      title: `Step ${index + 1}`,
      body: 'Body',
      placement: 'right' as const,
      completion: 'next_button' as const,
      nextUrl: index === stepCount - 1 ? nextUrl : undefined,
    })),
  }
}
