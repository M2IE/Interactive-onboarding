import type { StepPlacement } from '@interactive-onboarding/shared'

export type TargetSnapshot = {
  element: Element
  rect: DOMRect
}

export type TooltipPosition = {
  top: number
  left: number
}

const TOOLTIP_WIDTH = 348
const TOOLTIP_GAP = 18
const VIEWPORT_PADDING = 18

export function getTargetSnapshot(selector: string): TargetSnapshot | null {
  const element = document.querySelector(selector)

  if (!element) {
    return null
  }

  return {
    element,
    rect: element.getBoundingClientRect(),
  }
}

export function calculateTooltipPosition(
  rect: DOMRect,
  placement: StepPlacement,
): TooltipPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const idealLeftByCenter = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  const safeLeft = clamp(
    idealLeftByCenter,
    VIEWPORT_PADDING,
    viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
  )

  const belowTop = rect.bottom + TOOLTIP_GAP
  const aboveTop = rect.top - 220 - TOOLTIP_GAP

  if (placement === 'left') {
    return {
      top: clamp(rect.top - 16, VIEWPORT_PADDING, viewportHeight - 240),
      left: clamp(
        rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP,
        VIEWPORT_PADDING,
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
      ),
    }
  }

  if (placement === 'right') {
    return {
      top: clamp(rect.top - 16, VIEWPORT_PADDING, viewportHeight - 240),
      left: clamp(
        rect.right + TOOLTIP_GAP,
        VIEWPORT_PADDING,
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
      ),
    }
  }

  if (placement === 'top' && aboveTop > VIEWPORT_PADDING) {
    return {
      top: aboveTop,
      left: safeLeft,
    }
  }

  return {
    top: clamp(belowTop, VIEWPORT_PADDING, viewportHeight - 240),
    left: safeLeft,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
