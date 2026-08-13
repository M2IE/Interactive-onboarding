import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

it('reacts to media query changes', () => {
  let listener: (() => void) | undefined
  const media = {
    matches: false,
    addEventListener: jest.fn((_, next) => { listener = next }),
    removeEventListener: jest.fn(),
  }
  window.matchMedia = jest.fn().mockReturnValue(media)
  const { result } = renderHook(() => useMediaQuery('(max-width: 1180px)'))
  expect(result.current).toBe(false)

  media.matches = true
  act(() => listener?.())
  expect(result.current).toBe(true)
})
