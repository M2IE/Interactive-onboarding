const settingsKey = 'onboarding-studio:settings'

type StorageArea = Pick<chrome.storage.StorageArea, 'get' | 'set' | 'remove'>

export function createExtensionStorage<TSettings = unknown>({
  local = chrome.storage.local,
  session = chrome.storage.session,
}: {
  local?: StorageArea
  session?: StorageArea
} = {}) {
  return {
    async getSettings(): Promise<TSettings | null> {
      const result = await local.get(settingsKey)
      return (result[settingsKey] as TSettings | undefined) ?? null
    },

    async setSettings(settings: TSettings) {
      await local.set({ [settingsKey]: settings })
    },

    async getTabSnapshot<T>(tabId: number): Promise<T | null> {
      const key = getTabKey(tabId)
      const result = await session.get(key)
      return (result[key] as T | undefined) ?? null
    },

    async setTabSnapshot<T>(tabId: number, snapshot: T) {
      await session.set({ [getTabKey(tabId)]: snapshot })
    },

    async clearTabSnapshot(tabId: number) {
      await session.remove(getTabKey(tabId))
    },
  }
}

function getTabKey(tabId: number) {
  return `onboarding-studio:tab:${tabId}`
}
