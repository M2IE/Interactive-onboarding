import { useCallback, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

const defaultMessage =
  'Есть несохранённые изменения. Покинуть страницу и потерять их?'

export function useUnsavedChanges(
  isDirty: boolean,
  message = defaultMessage,
) {
  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, message])

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return
    }

    if (window.confirm(message)) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker, message])

  return useCallback(
    () => !isDirty || window.confirm(message),
    [isDirty, message],
  )
}
