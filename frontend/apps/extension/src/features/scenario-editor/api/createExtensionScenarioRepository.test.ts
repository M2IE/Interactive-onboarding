import { describe, expect, it, jest } from '@jest/globals'
import type { AdminApiClient } from '@interactive-onboarding/api-client'
import { createExtensionScenarioRepository } from './createExtensionScenarioRepository'

describe('extension scenario repository', () => {
  it('loads the draft for the exact pathname', async () => {
    const apiClient = createApiClient()
    const repository = createExtensionScenarioRepository(apiClient, 'demo')

    await expect(repository.findPageDraft('/products')).resolves.toMatchObject({
      projectId: 'project-1',
      draft: { id: 'draft-1', url: '/products' },
      hasPublishedScenario: true,
    })
    expect(apiClient.getScenario).toHaveBeenCalledWith('draft-1')
  })

  it('creates new steps, removes deleted ones and sends the final order', async () => {
    const apiClient = createApiClient()
    const repository = createExtensionScenarioRepository(apiClient, 'demo')

    await repository.saveDraft({
      id: 'draft-1',
      projectId: 'project-1',
      name: 'Products',
      url: '/products',
      steps: [
        {
          id: 'local-step',
          persisted: false,
          order: 1,
          selector: '#new',
          title: 'New',
          body: 'Body',
        },
      ],
    })

    expect(apiClient.deleteStep).toHaveBeenCalledWith('draft-1', 'step-1')
    expect(apiClient.createStep).toHaveBeenCalledWith(
      'draft-1',
      expect.objectContaining({ selector: '#new' }),
    )
    expect(apiClient.reorderSteps).toHaveBeenCalledWith('draft-1', {
      order: [{ stepId: 'step-2', orderNum: 1 }],
    })
  })

  it('keeps the local draft outside the repository when an API write fails', async () => {
    const apiClient = createApiClient()
    apiClient.updateScenario = jest
      .fn<AdminApiClient['updateScenario']>()
      .mockRejectedValue(new Error('offline'))
    const repository = createExtensionScenarioRepository(apiClient, 'demo')
    const draft = {
      id: 'draft-1',
      projectId: 'project-1',
      name: 'Products',
      url: '/products',
      steps: [],
    }

    await expect(repository.saveDraft(draft)).rejects.toThrow('offline')
    expect(draft).toEqual(expect.objectContaining({ id: 'draft-1' }))
  })
})

function createApiClient(): AdminApiClient {
  const scenarios = [
    {
      id: 'draft-1',
      projectId: 'project-1',
      name: 'Products',
      url: '/products',
      status: 'draft' as const,
      updatedAt: '2026-08-12T10:00:00Z',
    },
    {
      id: 'published-1',
      projectId: 'project-1',
      name: 'Products live',
      url: '/products',
      status: 'published' as const,
      updatedAt: '2026-08-12T09:00:00Z',
    },
  ]
  const getScenario = jest
    .fn<AdminApiClient['getScenario']>()
    .mockResolvedValue({
      ...scenarios[0],
      steps: [
        {
          id: 'step-1',
          orderNum: 1,
          selector: '#old',
          title: 'Old',
          body: 'Body',
        },
      ],
    })

  return {
    getProjectByKey: jest.fn<AdminApiClient['getProjectByKey']>().mockResolvedValue({
      id: 'project-1',
      name: 'Demo',
      projectKey: 'demo',
    }),
    listScenarios: jest
      .fn<AdminApiClient['listScenarios']>()
      .mockResolvedValue(scenarios),
    getScenario,
    createScenario: jest
      .fn<AdminApiClient['createScenario']>()
      .mockResolvedValue(scenarios[0]),
    updateScenario: jest
      .fn<AdminApiClient['updateScenario']>()
      .mockResolvedValue(scenarios[0]),
    publishScenario: jest.fn<AdminApiClient['publishScenario']>(),
    unpublishScenario: jest.fn<AdminApiClient['unpublishScenario']>(),
    createStep: jest
      .fn<AdminApiClient['createStep']>()
      .mockResolvedValue({
        id: 'step-2',
        orderNum: 1,
        selector: '#new',
        title: 'New',
        body: 'Body',
      }),
    updateStep: jest.fn<AdminApiClient['updateStep']>(),
    deleteStep: jest.fn<AdminApiClient['deleteStep']>(),
    reorderSteps: jest.fn<AdminApiClient['reorderSteps']>(),
    getAnalytics: jest.fn<AdminApiClient['getAnalytics']>(),
    generateReport: jest.fn<AdminApiClient['generateReport']>(),
    resolveReportDownloadUrl: jest.fn<AdminApiClient['resolveReportDownloadUrl']>(),
  }
}
