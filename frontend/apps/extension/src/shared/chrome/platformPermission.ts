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
