import { afterEach, describe, expect, it } from '@jest/globals'
import { calculateTooltipPosition } from './target'

describe('calculateTooltipPosition', () => {
  afterEach(() => {
    setViewport(1024, 768)
  })

  it('places a mobile tooltip above a target in the lower viewport half', () => {
    setViewport(390, 844)

    expect(
      calculateTooltipPosition(createRect({ top: 540, height: 200 }), 'right'),
    ).toEqual({ top: 18, left: 18 })
  })

  it('places a mobile tooltip below a target in the upper viewport half', () => {
    setViewport(390, 844)

    expect(
      calculateTooltipPosition(createRect({ top: 80, height: 40 }), 'right'),
    ).toEqual({ top: 526, left: 18 })
  })

  it('keeps a measured desktop tooltip inside the viewport', () => {
    setViewport(1440, 1000)

    expect(
      calculateTooltipPosition(
        createRect({ top: 760, height: 64 }),
        'right',
        276,
      ),
    ).toEqual({ top: 706, left: 388 })
  })
})

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  })
}

function createRect({
  top,
  height,
}: {
  top: number
  height: number
}): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 20,
    right: 370,
    top,
    width: 350,
    x: 20,
    y: top,
    toJSON: () => ({}),
  }
}
