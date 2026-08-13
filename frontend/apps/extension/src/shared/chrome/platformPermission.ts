import type { ExtensionSettings } from '../../entities/settings/model/types'

export function normalizeSettings(settings: ExtensionSettings): ExtensionSettings {
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

export async function requestPlatformPermission(platformUrl: string) {
  const originPattern = `${new URL(platformUrl).origin}/*`
  const granted = await chrome.permissions.request({ origins: [originPattern] })

  if (!granted) {
    throw new Error('Chrome не дал расширению доступ к API платформы')
  }
}

export function getApiBaseUrl(platformUrl: string) {
  return new URL('/api/v1', platformUrl).toString().replace(/\/$/, '')
}
