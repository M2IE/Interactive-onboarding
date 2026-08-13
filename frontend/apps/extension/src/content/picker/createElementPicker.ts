import {
  describeElement,
  type ElementDescriptor,
} from '@interactive-onboarding/element-selector'

type ElementPickerOptions = {
  document: Document
  onCancel: () => void
  onSelect: (element: ElementDescriptor) => void
}

export type ElementPicker = {
  start: () => void
  stop: () => void
}

export function createElementPicker({
  document: targetDocument,
  onCancel,
  onSelect,
}: ElementPickerOptions): ElementPicker {
  let active = false
  let target: Element | null = null
  const outline = targetDocument.createElement('div')

  outline.dataset.onboardingExtensionOverlay = 'picker'
  Object.assign(outline.style, {
    background: 'rgba(10, 132, 255, 0.1)',
    border: '2px solid #0a84ff',
    borderRadius: '6px',
    boxShadow: '0 0 0 3px rgba(10, 132, 255, 0.18)',
    display: 'none',
    inset: '0 auto auto 0',
    pointerEvents: 'none',
    position: 'fixed',
    transition: 'transform 70ms ease, width 70ms ease, height 70ms ease',
    zIndex: '2147483646',
  })

  function start() {
    if (active) {
      return
    }

    active = true
    targetDocument.documentElement.append(outline)
    targetDocument.addEventListener('pointerover', handlePointer, true)
    targetDocument.addEventListener('pointermove', handlePointer, true)
    targetDocument.addEventListener('click', handleClick, true)
    targetDocument.addEventListener('keydown', handleKeyDown, true)
  }

  function stop() {
    if (!active) {
      return
    }

    active = false
    target = null
    outline.remove()
    targetDocument.removeEventListener('pointerover', handlePointer, true)
    targetDocument.removeEventListener('pointermove', handlePointer, true)
    targetDocument.removeEventListener('click', handleClick, true)
    targetDocument.removeEventListener('keydown', handleKeyDown, true)
  }

  function handlePointer(event: Event) {
    const nextTarget = getInspectableTarget(event.target)

    if (!nextTarget) {
      return
    }

    target = nextTarget
    const rect = nextTarget.getBoundingClientRect()
    outline.style.display = 'block'
    outline.style.height = `${rect.height}px`
    outline.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    outline.style.width = `${rect.width}px`
  }

  function handleClick(event: MouseEvent) {
    event.preventDefault()
    event.stopImmediatePropagation()

    if (!target) {
      return
    }

    const descriptor = describeElement(target, targetDocument)
    stop()
    onSelect(descriptor)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape') {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()
    stop()
    onCancel()
  }

  return { start, stop }
}

function getInspectableTarget(value: EventTarget | null) {
  if (!(value instanceof Element)) {
    return null
  }

  if (
    value.closest(
      '[data-onboarding-extension-overlay], [data-onboarding-sdk-root]',
    )
  ) {
    return null
  }

  return value.closest('[data-onboarding-id]') ?? value
}
