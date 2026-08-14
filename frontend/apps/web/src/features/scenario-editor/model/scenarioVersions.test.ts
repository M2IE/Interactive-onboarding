import type { OnboardingScenario } from '@m2ie/onboarding-sdk'
import { defaultScenario } from '@/entities/scenario/defaultScenario'
import {
  findPublishedVersion,
  groupScenarioVersions,
  isSameLogicalScenario,
} from './scenarioVersions'

describe('scenario version groups', () => {
  it('combines draft and published snapshots of the same page', () => {
    const draft = createVersion('draft-id', 'draft', '/demo/profile')
    const published = createVersion(
      'published-id',
      'published',
      'https://classified.local/demo/profile?source=admin',
    )

    const groups = groupScenarioVersions([published, draft])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual(
      expect.objectContaining({
        primary: draft,
        draft,
        published,
      }),
    )
  })

  it('keeps scenarios on different paths separate', () => {
    const profile = createVersion('profile', 'draft', '/demo/profile')
    const listing = createVersion('listing', 'published', '/demo/new')

    expect(groupScenarioVersions([profile, listing])).toHaveLength(2)
    expect(isSameLogicalScenario(profile, listing)).toBe(false)
  })

  it('selects the newest archived version while preserving its history count', () => {
    const older = createVersion('archived-1', 'archived', '/demo/profile', '2026-08-01')
    const newer = createVersion('archived-2', 'archived', '/demo/profile', '2026-08-02')

    const [group] = groupScenarioVersions([older, newer])

    expect(group.primary.id).toBe('archived-2')
    expect(group.archived.map((scenario) => scenario.id)).toEqual([
      'archived-2',
      'archived-1',
    ])
  })

  it('finds the published snapshot paired with an editable draft', () => {
    const draft = createVersion('draft-id', 'draft', '/demo/profile')
    const published = createVersion('published-id', 'published', '/demo/profile')

    expect(findPublishedVersion([draft, published], draft)).toBe(published)
  })
})

function createVersion(
  id: string,
  status: OnboardingScenario['status'],
  url: string,
  updatedAt = '2026-08-14T00:00:00.000Z',
): OnboardingScenario {
  return {
    ...defaultScenario,
    id,
    status,
    url,
    updatedAt,
    steps: defaultScenario.steps.map((step) => ({ ...step })),
  }
}
