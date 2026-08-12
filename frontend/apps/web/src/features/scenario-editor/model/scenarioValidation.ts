import type { OnboardingScenario } from '@m2ie/onboarding-sdk'

export type ScenarioValidationIssue = {
  severity: 'error' | 'warning'
  code:
    | 'missing_name'
    | 'invalid_page_url'
    | 'missing_steps'
    | 'missing_selector'
    | 'invalid_selector'
    | 'unstable_selector'
    | 'duplicate_selector'
    | 'missing_title'
    | 'missing_body'
    | 'invalid_next_url'
  message: string
  stepId?: string
}

export type ScenarioValidation = {
  status: 'valid' | 'invalid'
  issues: ScenarioValidationIssue[]
  errors: ScenarioValidationIssue[]
  warnings: ScenarioValidationIssue[]
}

export function validateScenario(
  scenario: OnboardingScenario,
): ScenarioValidation {
  const issues: ScenarioValidationIssue[] = []

  if (!scenario.name.trim()) {
    issues.push({
      severity: 'error',
      code: 'missing_name',
      message: 'Укажите понятное название сценария.',
    })
  }

  if (!isPageUrl(scenario.url)) {
    issues.push({
      severity: 'error',
      code: 'invalid_page_url',
      message: 'Путь страницы должен начинаться с символа /.',
    })
  }

  if (scenario.steps.length === 0) {
    issues.push({
      severity: 'error',
      code: 'missing_steps',
      message: 'Добавьте хотя бы один шаг.',
    })
  }

  const selectorCounts = new Map<string, number>()
  scenario.steps.forEach((step) => {
    const selector = step.selector.trim()
    selectorCounts.set(selector, (selectorCounts.get(selector) ?? 0) + 1)

    if (!selector) {
      issues.push({
        severity: 'error',
        code: 'missing_selector',
        message: `Шаг ${step.order}: выберите элемент страницы.`,
        stepId: step.id,
      })
    } else if (!isValidSelector(selector)) {
      issues.push({
        severity: 'error',
        code: 'invalid_selector',
        message: `Шаг ${step.order}: CSS-селектор записан с ошибкой.`,
        stepId: step.id,
      })
    } else if (!selector.includes('data-onboarding-id')) {
      issues.push({
        severity: 'warning',
        code: 'unstable_selector',
        message: `Шаг ${step.order}: лучше использовать стабильный data-onboarding-id.`,
        stepId: step.id,
      })
    }

    if (!step.title.trim()) {
      issues.push({
        severity: 'error',
        code: 'missing_title',
        message: `Шаг ${step.order}: заполните заголовок подсказки.`,
        stepId: step.id,
      })
    }

    if (!step.body.trim()) {
      issues.push({
        severity: 'error',
        code: 'missing_body',
        message: `Шаг ${step.order}: заполните текст подсказки.`,
        stepId: step.id,
      })
    }

    if (step.nextUrl && !isNavigationUrl(step.nextUrl)) {
      issues.push({
        severity: 'error',
        code: 'invalid_next_url',
        message: `Шаг ${step.order}: адрес перехода должен быть путём или полной http(s)-ссылкой.`,
        stepId: step.id,
      })
    }
  })

  scenario.steps.forEach((step) => {
    const selector = step.selector.trim()

    if (selector && (selectorCounts.get(selector) ?? 0) > 1) {
      issues.push({
        severity: 'warning',
        code: 'duplicate_selector',
        message: `Шаг ${step.order}: этот элемент уже используется в сценарии.`,
        stepId: step.id,
      })
    }
  })

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return {
    status: errors.length > 0 ? 'invalid' : 'valid',
    issues,
    errors,
    warnings,
  }
}

function isPageUrl(value: string) {
  return value.startsWith('/') && !value.startsWith('//')
}

function isNavigationUrl(value: string) {
  if (isPageUrl(value)) {
    return true
  }

  try {
    return /^https?:$/.test(new URL(value).protocol)
  } catch {
    return false
  }
}

function isValidSelector(selector: string) {
  try {
    document.createDocumentFragment().querySelector(selector)
    return true
  } catch {
    return false
  }
}
