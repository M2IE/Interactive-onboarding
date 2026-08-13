import { describe, expect, it, jest } from '@jest/globals'
import { createPreviewApiClient } from './createPreviewRuntime'

describe('preview API client', () => {
  it('returns an isolated config without nextUrl and never sends events', async () => {
    const client = createPreviewApiClient({
      projectKey: 'demo',
      pageUrl: '/products',
      steps: [
        {
          id: 'step-1',
          order: 3,
          selector: '#target',
          title: 'Title',
          body: 'Body',
        },
      ],
    })
    const trackSpy = jest.spyOn(client, 'trackEvent')
    const config = await client.getConfig({
      projectKey: 'demo',
      pageUrl: '/products',
      sessionId: 'session',
    })

    expect(config?.scenarioId).toMatch(/^preview-/)
    expect(config?.steps[0]).toMatchObject({
      order: 1,
      completion: 'next_button',
      placement: 'right',
    })
    expect(config?.steps[0]).not.toHaveProperty('nextUrl')

    await client.trackEvent({
      projectKey: 'demo',
      scenarioId: config!.scenarioId,
      versionId: config!.versionId,
      sessionId: 'session',
      type: 'step_viewed',
      eventKey: 'preview-event',
      pageUrl: '/products',
      createdAt: new Date().toISOString(),
    })

    expect(trackSpy).toHaveBeenCalledTimes(1)
  })
})
