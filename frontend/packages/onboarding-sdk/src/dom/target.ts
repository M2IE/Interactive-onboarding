import type { StepPlacement } from '../types/contracts'

export type TargetSnapshot = {
  element: Element
  rect: DOMRect
}

export type TooltipPosition = {
  top: number
  left: number
}

const TOOLTIP_WIDTH = 348
const DEFAULT_TOOLTIP_HEIGHT = 300
const TOOLTIP_GAP = 18
const VIEWPORT_PADDING = 18
const MOBILE_BREAKPOINT = 620

export function getTargetSnapshot(selector: string): TargetSnapshot | null {
  let element: Element | null

  try {
    element = document.querySelector(selector)
  } catch {
    return null
  }

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
  measuredTooltipHeight = DEFAULT_TOOLTIP_HEIGHT,
): TooltipPosition {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const tooltipHeight = Math.min(
    measuredTooltipHeight || DEFAULT_TOOLTIP_HEIGHT,
    viewportHeight - VIEWPORT_PADDING * 2,
  )
  const latestSafeTop = Math.max(
    VIEWPORT_PADDING,
    viewportHeight - tooltipHeight - VIEWPORT_PADDING,
  )

  if (viewportWidth <= MOBILE_BREAKPOINT) {
    const targetCenter = rect.top + rect.height / 2
    const targetIsInLowerHalf = targetCenter > viewportHeight / 2

    return {
      top: targetIsInLowerHalf
        ? VIEWPORT_PADDING
        : latestSafeTop,
      left: VIEWPORT_PADDING,
    }
  }

  const idealLeftByCenter = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  const safeLeft = clamp(
    idealLeftByCenter,
    VIEWPORT_PADDING,
    viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
  )

  const belowTop = rect.bottom + TOOLTIP_GAP
  const aboveTop = rect.top - tooltipHeight - TOOLTIP_GAP

  if (placement === 'left') {
    return {
      top: clamp(rect.top - 16, VIEWPORT_PADDING, latestSafeTop),
      left: clamp(
        rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP,
        VIEWPORT_PADDING,
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
      ),
    }
  }

  if (placement === 'right') {
    return {
      top: clamp(rect.top - 16, VIEWPORT_PADDING, latestSafeTop),
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
    top: clamp(belowTop, VIEWPORT_PADDING, latestSafeTop),
    left: safeLeft,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
