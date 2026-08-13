export type SelectorConfidence = 'high' | 'medium' | 'low'

export type ElementDescriptor = {
  selector: string
  confidence: SelectorConfidence
  tagName: string
  role?: string
  label?: string
  matchCount: number
  warnings: string[]
}

type SelectorCandidate = {
  selector: string
  confidence: SelectorConfidence
  warning?: string
}

const preferredDataAttributes = [
  'data-testid',
  'data-test',
  'data-qa',
  'data-cy',
]

const ignoredDataAttributes = new Set([
  'data-reactid',
  'data-reactroot',
  'data-v-app',
])

export function describeElement(
  element: Element,
  root: ParentNode = document,
): ElementDescriptor {
  const candidates = buildCandidates(element)
  const onboardingCandidate = candidates.find((candidate) =>
    candidate.selector.startsWith('[data-onboarding-id='),
  )
  let selected = onboardingCandidate ?? candidates[0] ?? {
    selector: element.tagName.toLowerCase(),
    confidence: 'low' as const,
  }
  let matchCount = countMatches(root, selected.selector)

  if (!onboardingCandidate) {
    for (const candidate of candidates) {
      const candidateMatchCount = countMatches(root, candidate.selector)

      if (candidateMatchCount === 1) {
        selected = candidate
        matchCount = candidateMatchCount
        break
      }
    }
  }

  const warnings = new Set<string>()

  if (selected.warning) {
    warnings.add(selected.warning)
  }

  if (matchCount !== 1) {
    warnings.add(
      matchCount === 0
        ? 'Селектор больше не находит элемент'
        : `Селектор находит несколько элементов: ${matchCount}`,
    )
  }

  if (selected.confidence === 'low') {
    warnings.add('Селектор зависит от структуры страницы и может стать нестабильным')
  }

  if (!onboardingCandidate) {
    warnings.add(
      'На элементе нет data-onboarding-id. Добавьте стабильный атрибут перед публикацией.',
    )
  }

  return {
    selector: selected.selector,
    confidence: matchCount === 1 ? selected.confidence : 'low',
    tagName: element.tagName.toLowerCase(),
    role: getSafeAttribute(element, 'role'),
    label: getSafeLabel(element),
    matchCount,
    warnings: [...warnings],
  }
}

function buildCandidates(element: Element): SelectorCandidate[] {
  const candidates: SelectorCandidate[] = []
  const tagName = element.tagName.toLowerCase()
  const onboardingId = getSafeAttribute(element, 'data-onboarding-id')

  if (onboardingId) {
    candidates.push({
      selector: attributeSelector('data-onboarding-id', onboardingId),
      confidence: 'high',
    })
  }

  const id = getSafeAttribute(element, 'id')

  if (id) {
    candidates.push({
      selector: `#${escapeCssIdentifier(id)}`,
      confidence: looksGenerated(id) ? 'medium' : 'high',
      warning: looksGenerated(id)
        ? 'ID похож на сгенерированный и может измениться'
        : undefined,
    })
  }

  for (const attribute of getStableAttributes(element)) {
    candidates.push({
      selector: `${tagName}${attributeSelector(attribute.name, attribute.value)}`,
      confidence: attribute.confidence,
    })
  }

  const stableClasses = getStableClasses(element)

  if (stableClasses.length > 0) {
    candidates.push({
      selector: `${tagName}${stableClasses
        .slice(0, 3)
        .map((className) => `.${escapeCssIdentifier(className)}`)
        .join('')}`,
      confidence: 'medium',
    })
  }

  candidates.push({ selector: buildElementPath(element), confidence: 'low' })

  return deduplicateCandidates(candidates)
}

function getStableAttributes(element: Element) {
  const attributes: Array<{
    name: string
    value: string
    confidence: SelectorConfidence
  }> = []

  for (const name of preferredDataAttributes) {
    const value = getSafeAttribute(element, name)

    if (value) {
      attributes.push({ name, value, confidence: 'high' })
    }
  }

  for (const attribute of [...element.attributes]) {
    if (
      !attribute.name.startsWith('data-') ||
      attribute.name === 'data-onboarding-id' ||
      preferredDataAttributes.includes(attribute.name) ||
      ignoredDataAttributes.has(attribute.name) ||
      isSensitiveAttributeName(attribute.name) ||
      !isSafeSelectorValue(attribute.value)
    ) {
      continue
    }

    attributes.push({
      name: attribute.name,
      value: attribute.value,
      confidence: 'medium',
    })
  }

  for (const name of ['name', 'role', 'aria-label']) {
    const value = getSafeAttribute(element, name)

    if (value) {
      attributes.push({ name, value, confidence: 'medium' })
    }
  }

  return attributes
}

function getStableClasses(element: Element) {
  return [...element.classList].filter(
    (className) =>
      className.length <= 48 &&
      /^[a-zA-Z][\w-]*$/.test(className) &&
      !looksGenerated(className) &&
      !/^(active|current|disabled|focus|hover|open|selected)$/i.test(className),
  )
}

function buildElementPath(element: Element) {
  const segments: string[] = []
  let current: Element | null = element

  while (current && segments.length < 4) {
    const id = getSafeAttribute(current, 'id')

    if (id && !looksGenerated(id)) {
      segments.unshift(`#${escapeCssIdentifier(id)}`)
      break
    }

    const onboardingId = getSafeAttribute(current, 'data-onboarding-id')

    if (onboardingId) {
      segments.unshift(attributeSelector('data-onboarding-id', onboardingId))
      break
    }

    segments.unshift(buildPathSegment(current))
    current = current.parentElement
  }

  return segments.join(' > ')
}

function buildPathSegment(element: Element) {
  const tagName = element.tagName.toLowerCase()
  const stableClass = getStableClasses(element)[0]
  const base = stableClass
    ? `${tagName}.${escapeCssIdentifier(stableClass)}`
    : tagName
  const siblings = element.parentElement
    ? [...element.parentElement.children].filter(
        (child) => child.tagName === element.tagName,
      )
    : []

  if (siblings.length <= 1) {
    return base
  }

  return `${base}:nth-of-type(${siblings.indexOf(element) + 1})`
}

function getSafeLabel(element: Element) {
  const label = getSafeAttribute(element, 'aria-label')

  return label && !looksLikePersonalData(label) ? label : undefined
}

function getSafeAttribute(element: Element, name: string) {
  if (isSensitiveAttributeName(name)) {
    return undefined
  }

  const value = element.getAttribute(name)?.trim()

  return value && isSafeSelectorValue(value) ? value : undefined
}

function isSensitiveAttributeName(name: string) {
  return /^(?:data-)?(?:account-id|email|phone|session-id|token|user-id)$/i.test(
    name,
  )
}

function isSafeSelectorValue(value: string) {
  return value.length > 0 && value.length <= 80 && !looksLikePersonalData(value)
}

function looksLikePersonalData(value: string) {
  return /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(value) ||
    /(?:\+?\d[\s()-]*){7,}/.test(value)
}

function looksGenerated(value: string) {
  return (
    /(?:^|[-_])(css|jsx|sc|style)[-_]/i.test(value) ||
    /[a-f\d]{8,}/i.test(value) ||
    /\d{4,}/.test(value)
  )
}

function attributeSelector(name: string, value: string) {
  return `[${name}="${escapeCssString(value)}"]`
}

function escapeCssIdentifier(value: string) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (character, leadingDigit) =>
    leadingDigit ? `\\3${character} ` : `\\${character}`,
  )
}

function escapeCssString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function countMatches(root: ParentNode, selector: string) {
  try {
    return root.querySelectorAll(selector).length
  } catch {
    return 0
  }
}

function deduplicateCandidates(candidates: SelectorCandidate[]) {
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    if (seen.has(candidate.selector)) {
      return false
    }

    seen.add(candidate.selector)
    return true
  })
}
