export function triggerBrowserDownload(url: string, filename?: string) {
  const link = document.createElement('a')
  link.href = url
  link.style.display = 'none'

  if (filename) {
    link.download = filename
  }

  document.body.append(link)
  link.click()
  link.remove()
}
