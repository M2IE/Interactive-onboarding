import type { OnboardingScenario } from '@m2ie/onboarding-sdk'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { buildJourneyGraph, normalizeJourneyPath } from './graph'

describe('journey graph', () => {
  it('normalizes absolute URLs, query, hash and trailing slashes', () => {
    expect(normalizeJourneyPath('https://example.test/demo/new/?a=1#top')).toBe('/demo/new')
    expect(normalizeJourneyPath('/')).toBe('/')
  })

  it('builds the published demo journey and excludes drafts', () => {
    const draft = { ...defaultScenarios[0], id: 'draft', status: 'draft' as const }
    const graph = buildJourneyGraph([...defaultScenarios, draft])

    expect(graph.nodes.filter((node) => node.kind === 'scenario')).toHaveLength(4)
    expect(graph.edges).toHaveLength(3)
    expect(graph.rootIds).toEqual(['scenario-first-listing-profile'])
  })

  it('builds flow edges by backend order even without nextUrl', () => {
    const source = patchScenario(defaultScenarios[0], {
      steps: [{ ...defaultScenarios[0].steps[0], nextUrl: undefined }],
    })
    const graph = buildJourneyGraph([source, defaultScenarios[1]])

    expect(graph.edges.find((edge) => edge.source === source.id)).toMatchObject({
      target: defaultScenarios[1].id,
      count: 1,
    })
  })

  it('creates diagnostics for missing targets, multiple roots and cycles', () => {
    const missing = patchScenario(defaultScenarios[0], {
      flowKey: '',
      flowOrder: 0,
      steps: [{ ...defaultScenarios[0].steps[0], nextUrl: '/unknown' }],
    })
    const isolated = patchScenario(defaultScenarios[1], { id: 'isolated', flowKey: '', flowOrder: 0, url: '/isolated', steps: [] })
    const graph = buildJourneyGraph([missing, isolated])

    expect(graph.diagnostics.map((item) => item.kind)).toEqual(
      expect.arrayContaining(['missing_target', 'multiple_roots']),
    )
    expect(graph.nodes.some((node) => node.kind === 'missing')).toBe(true)

    const first = patchScenario(defaultScenarios[0], {
      flowKey: '',
      flowOrder: 0,
      steps: [{ ...defaultScenarios[0].steps[0], nextUrl: '/second' }],
    })
    const second = patchScenario(defaultScenarios[1], {
      flowKey: '',
      flowOrder: 0,
      url: '/second',
      steps: [{ ...defaultScenarios[1].steps[0], nextUrl: first.url }],
    })
    expect(buildJourneyGraph([first, second]).diagnostics.some((item) => item.kind === 'cycle')).toBe(true)
  })
})

function patchScenario(
  scenario: OnboardingScenario,
  patch: Partial<OnboardingScenario>,
): OnboardingScenario {
  return { ...scenario, ...patch }
}
