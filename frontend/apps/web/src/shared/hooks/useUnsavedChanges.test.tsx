import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUnsavedChanges } from './useUnsavedChanges'

describe('useUnsavedChanges', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('asks for confirmation only when changes are dirty', () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false)
    const { result, rerender } = renderHook(
      ({ dirty }) => useUnsavedChanges(dirty),
      {
        initialProps: { dirty: false },
        wrapper: RouterTestProvider,
      },
    )

    expect(result.current()).toBe(true)
    expect(confirm).not.toHaveBeenCalled()

    rerender({ dirty: true })
    expect(result.current()).toBe(false)
    expect(confirm).toHaveBeenCalledTimes(1)
  })
})

function RouterTestProvider({ children }: { children: ReactNode }) {
  const router = createMemoryRouter([{ path: '*', element: children }])

  return <RouterProvider router={router} />
}
