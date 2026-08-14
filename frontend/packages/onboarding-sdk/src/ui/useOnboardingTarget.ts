import { useEffect, useState } from 'react'
import type { OnboardingStep } from '../types/contracts'
import { getTargetSnapshot, type TargetSnapshot } from '../dom/target'

export type TargetState =
  | { status: 'idle' }
  | { status: 'waiting'; selector: string }
  | { status: 'ready'; selector: string; target: TargetSnapshot }
  | { status: 'missing'; selector: string }

export function useOnboardingTarget({
  onMissing,
  step,
  waitMs,
}: {
  onMissing: (step: OnboardingStep) => void
  step?: OnboardingStep
  waitMs: number
}) {
  const [state, setState] = useState<TargetState>({ status: 'idle' })

  useEffect(() => {
    if (!step) {
      return
    }

    const selector = step.selector
    let targetElement: Element | null = null
    let missingReported = false
    let scrollRequested = false

    const update = () => {
      const nextTarget = getTargetSnapshot(selector)

      if (!nextTarget) {
        targetElement = null
        setState((current) =>
          current.status === 'missing'
            ? current
            : { status: 'waiting', selector },
        )
        return
      }

      targetElement = nextTarget.element

      if (!scrollRequested) {
        scrollRequested = true
        const shouldScroll =
          nextTarget.rect.top < 120 ||
          nextTarget.rect.bottom > window.innerHeight - 120

        if (shouldScroll) {
          nextTarget.element.scrollIntoView({
            block: 'center',
            inline: 'nearest',
            behavior: 'smooth',
          })
        }
      }

      setState({ status: 'ready', selector, target: nextTarget })
    }

    const observer = new MutationObserver(() => {
      if (!targetElement?.isConnected) {
        update()
      }
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    const timeoutId = window.setTimeout(() => {
      if (targetElement || missingReported) {
        return
      }

      missingReported = true
      setState({ status: 'missing', selector })
      onMissing(step)
    }, Math.max(0, waitMs))
    const refreshId = window.setTimeout(update, 50)

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      observer.disconnect()
      window.clearTimeout(timeoutId)
      window.clearTimeout(refreshId)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [onMissing, step, waitMs])

  return state
}
