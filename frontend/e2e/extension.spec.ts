import { chromium, expect, test } from '@playwright/test'
import path from 'node:path'

test('unpacked extension boots its Manifest V3 side panel', async () => {
  const extensionPath = path.resolve('apps/extension/dist')
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })

  try {
    let [serviceWorker] = context.serviceWorkers()
    serviceWorker ??= await context.waitForEvent('serviceworker')
    const extensionId = new URL(serviceWorker.url()).host
    const page = await context.newPage()

    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`)

    await expect(
      page.getByRole('heading', { name: 'Страница недоступна' }),
    ).toBeVisible()
    await expect(page.locator('#root')).not.toBeEmpty()
    expect(await serviceWorker.evaluate(() => chrome.runtime.getManifest().name)).toBe(
      'Onboarding Studio',
    )
  } finally {
    await context.close()
  }
})
