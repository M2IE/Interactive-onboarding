import { describe, expect, it, jest } from '@jest/globals'
import type { OnboardingScenario } from '@interactive-onboarding/shared'
import { createRealScenarioRepository } from './createRealScenarioRepository'

describe('real scenario repository', () => {
  it('resolves the project and maps saved steps including navigation', async () => {
    const fetchClient = createRouter({
      '/api/v1/admin/projects/interactive-onboarding': {
        id: 'project-1',
        name: 'Onboarding',
        projectKey: 'interactive-onboarding',
      },
      '/api/v1/admin/scenarios?page=1&size=100&projectId=project-1': {
        items: [
          {
            id: 'scenario-1',
            projectId: 'project-1',
            name: 'Profile',
            url: '/demo/profile',
            status: 'published',
          },
          {
            id: 'scenario-archived',
            projectId: 'project-1',
            name: 'Old profile version',
            url: '/demo/profile',
            status: 'archived',
          },
        ],
        total: 2,
      },
      '/api/v1/admin/scenarios/scenario-1': {
        id: 'scenario-1',
        projectId: 'project-1',
        name: 'Profile',
        url: '/demo/profile',
        status: 'published',
        steps: [
          {
            id: 'step-1',
            orderNum: 1,
            selector: '[data-onboarding-id="profile-create-button"]',
            title: 'Start',
            body: 'Create a listing',
            nextUrl: '/demo/new',
          },
        ],
      },
      '/api/v1/admin/scenarios/scenario-archived': {
        id: 'scenario-archived',
        projectId: 'project-1',
        name: 'Old profile version',
        url: '/demo/profile',
        status: 'archived',
        steps: [
          {
            id: 'step-archived',
            orderNum: 1,
            selector: '[data-onboarding-id="profile-create-button"]',
            title: 'Archived start',
            body: 'Historical copy',
          },
        ],
      },
    })
    const repository = createRealScenarioRepository({
      apiBaseUrl: '/api/v1',
      projectKey: 'interactive-onboarding',
      fetchClient,
    })

    const scenarios = await repository.listScenarios()

    expect(scenarios).toEqual([
      expect.objectContaining({
        id: 'scenario-1',
        projectKey: 'interactive-onboarding',
        status: 'published',
        steps: [expect.objectContaining({ nextUrl: '/demo/new' })],
      }),
      expect.objectContaining({
        id: 'scenario-archived',
        status: 'archived',
        steps: [expect.objectContaining({ id: 'step-archived' })],
      }),
    ])
  })

  it('switches to the immutable published copy returned by publish', async () => {
    const draft = createDraft()
    const fetchClient = createMethodRouter({
      'PATCH /api/v1/admin/scenarios/draft-1': {
        id: 'draft-1',
        projectId: 'project-1',
        name: draft.name,
        url: draft.url,
        status: 'draft',
      },
      'PATCH /api/v1/admin/scenarios/draft-1/steps/step-1': {
        id: 'step-1',
        orderNum: 1,
        selector: '#target',
        title: 'Title',
        body: 'Body',
      },
      'GET /api/v1/admin/scenarios/draft-1': toAdminScenario(draft),
      'POST /api/v1/admin/scenarios/draft-1/publish': {
        id: 'published-1',
        projectId: 'project-1',
        name: draft.name,
        url: draft.url,
        status: 'published',
      },
      'GET /api/v1/admin/scenarios/published-1': {
        ...toAdminScenario(draft),
        id: 'published-1',
        status: 'published',
      },
    })
    const repository = createRealScenarioRepository({
      apiBaseUrl: '/api/v1',
      projectId: 'project-1',
      projectKey: 'interactive-onboarding',
      fetchClient,
    })

    const published = await repository.publishScenario(draft)

    expect(published).toEqual(
      expect.objectContaining({ id: 'published-1', status: 'published' }),
    )
  })

  it('unpublishes and reloads the editable scenario from the API', async () => {
    const published = {
      ...createDraft(),
      id: 'published-1',
      status: 'published' as const,
    }
    const fetchClient = createMethodRouter({
      'POST /api/v1/admin/scenarios/published-1/unpublish': undefined,
      'GET /api/v1/admin/scenarios/published-1': {
        ...toAdminScenario(published),
        status: 'draft',
      },
    })
    const repository = createRealScenarioRepository({
      apiBaseUrl: '/api/v1',
      projectId: 'project-1',
      projectKey: 'interactive-onboarding',
      fetchClient,
    })

    const unpublished = await repository.unpublishScenario(published)

    expect(unpublished).toEqual(
      expect.objectContaining({ id: 'published-1', status: 'draft' }),
    )
    expect(fetchClient).toHaveBeenCalledWith(
      '/api/v1/admin/scenarios/published-1/unpublish',
      { method: 'POST' },
    )
  })
})

function createRouter(responses: Record<string, unknown>) {
  return jest.fn<typeof fetch>().mockImplementation(async (url) => {
    const key = String(url)

    if (!(key in responses)) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: `Missing fixture: ${key}` } }),
      } as Response
    }

    return {
      ok: true,
      status: 200,
      json: async () => responses[key],
    } as Response
  })
}

function createMethodRouter(responses: Record<string, unknown>) {
  return jest.fn<typeof fetch>().mockImplementation(async (url, init) => {
    const key = `${init?.method ?? 'GET'} ${String(url)}`

    return {
      ok: key in responses,
      status: key in responses ? 200 : 404,
      json: async () =>
        responses[key] ?? { error: { message: `Missing fixture: ${key}` } },
    } as Response
  })
}

function createDraft(): OnboardingScenario {
  return {
    id: 'draft-1',
    projectId: 'project-1',
    projectKey: 'interactive-onboarding',
    flowKey: 'draft-1',
    flowOrder: 1,
    name: 'Draft',
    description: '',
    url: '/demo/draft',
    status: 'draft',
    version: 1,
    versionId: 'draft-1',
    createdAt: '2026-08-09T00:00:00.000Z',
    updatedAt: '2026-08-09T00:00:00.000Z',
    steps: [
      {
        id: 'step-1',
        versionId: 'draft-1',
        order: 1,
        selector: '#target',
        title: 'Title',
        body: 'Body',
        placement: 'right',
        completion: 'next_button',
      },
    ],
  }
}

function toAdminScenario(scenario: OnboardingScenario) {
  return {
    id: scenario.id,
    projectId: scenario.projectId,
    name: scenario.name,
    url: scenario.url,
    status: scenario.status,
    steps: scenario.steps.map((step) => ({
      id: step.id,
      orderNum: step.order,
      selector: step.selector,
      title: step.title,
      body: step.body,
      nextUrl: step.nextUrl,
    })),
  }
}
