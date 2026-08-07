import { useEffect, useState } from 'react'

function readPathname() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return window.location.pathname
}

export function useCurrentPath() {
  const [path, setPath] = useState(readPathname)

  useEffect(() => {
    const updatePath = () => setPath(readPathname())

    window.addEventListener('popstate', updatePath)
    window.addEventListener('hashchange', updatePath)

    return () => {
      window.removeEventListener('popstate', updatePath)
      window.removeEventListener('hashchange', updatePath)
    }
  }, [])

  return path
}
