import { describe, expect, it } from '@jest/globals'
import { createExtensionStorage } from './extensionStorage'

describe('extension storage', () => {
  it('persists settings locally and restores a per-tab draft snapshot', async () => {
    const local = createMemoryStorage()
    const session = createMemoryStorage()
    const storage = createExtensionStorage({
      local: local.area,
      session: session.area,
    })
    const settings = {
      platformUrl: 'https://platform.example.com',
      projectKey: 'demo',
    }
    const snapshot = { draftId: 'local-1', picker: 'active' }

    await storage.setSettings(settings)
    await storage.setTabSnapshot(42, snapshot)

    await expect(storage.getSettings()).resolves.toEqual(settings)
    await expect(storage.getTabSnapshot(42)).resolves.toEqual(snapshot)

    await storage.clearTabSnapshot(42)
    await expect(storage.getTabSnapshot(42)).resolves.toBeNull()
  })
})

function createMemoryStorage() {
  const values: Record<string, unknown> = {}

  return {
    values,
    area: {
      async get(keys: string | string[]) {
        const requestedKeys = Array.isArray(keys) ? keys : [keys]
        return Object.fromEntries(
          requestedKeys
            .filter((key) => key in values)
            .map((key) => [key, values[key]]),
        )
      },
      async set(items: Record<string, unknown>) {
        Object.assign(values, items)
      },
      async remove(keys: string | string[]) {
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          delete values[key]
        }
      },
    } as Pick<chrome.storage.StorageArea, 'get' | 'set' | 'remove'>,
  }
}
