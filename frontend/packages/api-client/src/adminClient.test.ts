import { describe, expect, it, jest } from '@jest/globals'
import { createAdminApiClient } from './adminClient'

describe('Admin API client', () => {
  it('filters the scenario list by the configured project', async () => {
    const fetchClient = createFetch({ items: [], total: 0 })
    const client = createAdminApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    await client.listScenarios('project-1')

    expect(fetchClient).toHaveBeenCalledWith(
      '/api/v1/admin/scenarios?page=1&size=100&projectId=project-1',
      undefined,
    )
  })

  it('uses an absolute report URL without rewriting it', () => {
    const client = createAdminApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient: createFetch({}),
    })

    expect(
      client.resolveReportDownloadUrl(
        'scenario-1',
        'https://cdn.example.com/report.pdf',
      ),
    ).toBe('https://cdn.example.com/report.pdf')
  })

  it('returns the report filename from the current API contract', async () => {
    const fetchClient = createFetch({ filename: 'analytics-report.pdf' })
    const client = createAdminApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    await expect(client.generateReport('scenario-1')).resolves.toBe(
      'analytics-report.pdf',
    )
    expect(fetchClient).toHaveBeenCalledWith(
      '/api/v1/admin/analytics/scenario-1/report',
      { method: 'POST' },
    )
  })

  it('converts a backend file key into the report download endpoint', () => {
    const client = createAdminApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient: createFetch({}),
    })

    expect(
      client.resolveReportDownloadUrl('scenario-1', 'reports/report 1.pdf'),
    ).toBe(
      '/api/v1/admin/analytics/scenario-1/report?filename=reports%2Freport+1.pdf',
    )
  })

  it('sends the complete step order to the reorder endpoint', async () => {
    const fetchClient = createFetch(undefined, 204)
    const client = createAdminApiClient({
      apiBaseUrl: '/api/v1',
      fetchClient,
    })

    await client.reorderSteps('scenario-1', {
      order: [
        { stepId: 'step-2', orderNum: 1 },
        { stepId: 'step-1', orderNum: 2 },
      ],
    })

    expect(fetchClient).toHaveBeenCalledWith(
      '/api/v1/admin/scenarios/scenario-1/steps/order',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: [
            { stepId: 'step-2', orderNum: 1 },
            { stepId: 'step-1', orderNum: 2 },
          ],
        }),
      },
    )
  })
})

function createFetch(body: unknown, status = 200) {
  return jest.fn<typeof fetch>().mockResolvedValue({
    ok: true,
    status,
    json: async () => body,
  } as Response)
}
