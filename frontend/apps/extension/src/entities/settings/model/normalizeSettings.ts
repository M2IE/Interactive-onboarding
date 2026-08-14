import type { ExtensionSettings } from './types'

export function normalizeSettings(
  settings: ExtensionSettings,
): ExtensionSettings {
  const platformUrl = new URL(settings.platformUrl)

  if (!/^https?:$/.test(platformUrl.protocol)) {
    throw new Error('Платформа должна использовать http или https')
  }

  const projectKey = settings.projectKey.trim()

  if (!projectKey) {
    throw new Error('Укажите projectKey')
  }

  return {
    platformUrl: platformUrl.origin,
    projectKey,
  }
}
