type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function readJson<T>(key: string, fallback: T): T {
  const storage = getStorage()

  if (!storage) {
    return fallback
  }

  const stored = storage.getItem(key)

  if (!stored) {
    return fallback
  }

  try {
    return JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(value))
}

export function removeStoredValue(key: string) {
  getStorage()?.removeItem(key)
}
