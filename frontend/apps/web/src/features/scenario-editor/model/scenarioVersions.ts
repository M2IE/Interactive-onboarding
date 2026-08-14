import type { OnboardingScenario } from '@m2ie/onboarding-sdk'

export type ScenarioVersionGroup = {
  key: string
  primary: OnboardingScenario
  draft?: OnboardingScenario
  published?: OnboardingScenario
  archived: OnboardingScenario[]
}

type MutableScenarioVersionGroup = Omit<ScenarioVersionGroup, 'primary'>

export function groupScenarioVersions(
  scenarios: OnboardingScenario[],
): ScenarioVersionGroup[] {
  const groups = new Map<string, MutableScenarioVersionGroup>()

  for (const scenario of scenarios) {
    const key = getLogicalScenarioKey(scenario)
    const group = groups.get(key) ?? { key, archived: [] }

    if (scenario.status === 'draft') {
      group.draft = pickLatest(group.draft, scenario)
    } else if (scenario.status === 'published') {
      group.published = pickLatest(group.published, scenario)
    } else {
      group.archived.push(scenario)
      group.archived.sort(compareUpdatedAtDescending)
    }

    groups.set(key, group)
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    primary: group.draft ?? group.published ?? group.archived[0],
  }))
}

export function getLogicalScenarioKey(scenario: OnboardingScenario) {
  return `${scenario.projectId}:${normalizeScenarioPath(scenario.url)}`
}

export function findPublishedVersion(
  scenarios: OnboardingScenario[],
  scenario: OnboardingScenario,
) {
  const key = getLogicalScenarioKey(scenario)

  return groupScenarioVersions(scenarios).find((group) => group.key === key)
    ?.published
}

export function isSameLogicalScenario(
  left: OnboardingScenario,
  right: OnboardingScenario,
) {
  return getLogicalScenarioKey(left) === getLogicalScenarioKey(right)
}

function normalizeScenarioPath(value: string) {
  try {
    const pathname = new URL(value, 'https://onboarding.local').pathname
    const normalized = pathname.replace(/\/+$/, '')
    return normalized || '/'
  } catch {
    const pathname = value.split(/[?#]/, 1)[0].replace(/\/+$/, '')
    return pathname || '/'
  }
}

function pickLatest(
  current: OnboardingScenario | undefined,
  candidate: OnboardingScenario,
) {
  if (!current) return candidate
  return compareUpdatedAtDescending(current, candidate) <= 0
    ? current
    : candidate
}

function compareUpdatedAtDescending(
  left: OnboardingScenario,
  right: OnboardingScenario,
) {
  return right.updatedAt.localeCompare(left.updatedAt)
}
