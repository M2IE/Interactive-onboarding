import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Сбросить' }).click()
})

test('home presents the product and branded entry points', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('link', { name: 'Interactive Onboarding' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'Помогайте пользователям двигаться дальше',
    }),
  ).toBeVisible()
  await expect(page.getByText('Создайте сценарий', { exact: true })).toBeVisible()
  await expect(page.getByText('Подключите SDK', { exact: true })).toBeVisible()
  await expect(page.getByText('Оцените результат', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('link', { name: /@m2ie\/onboarding-sdk/i }),
  ).toHaveAttribute(
    'href',
    'https://www.npmjs.com/package/@m2ie/onboarding-sdk',
  )
  await expect(
    page.getByLabel('Сценарий ведёт пользователя от элемента к результату'),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Создавайте подсказки прямо на сайте' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Как установить' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Установка Onboarding Studio' }),
  ).toContainText('chrome://extensions')
})

test('administrator edits, validates and saves a scenario', async ({ page }) => {
  await page
    .getByRole('button', { name: 'Создать сценарий', exact: true })
    .click()

  const nameInput = page.getByRole('textbox', { name: 'Название сценария' })
  await nameInput.fill('')

  await expect(page.getByRole('alert')).toContainText(
    'Укажите понятное название сценария',
  )
  await expect(page.getByRole('button', { name: 'Опубликовать' })).toBeDisabled()

  await nameInput.fill('Первое объявление: профиль E2E')
  await expect(page.getByRole('button', { name: 'Сохранить' })).toBeEnabled()
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
})

test('published onboarding advances through SPA pages and returns back', async ({
  page,
}) => {
  await page.goto('/demo/profile')

  await expect(
    page.getByRole('dialog', { name: 'Начните с первого объявления' }),
  ).toBeVisible()
  await expect(page.getByText('Шаг 1 из 6')).toBeVisible()
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page).toHaveURL(/\/demo\/new$/)

  await expect(page.getByRole('dialog', { name: 'Выберите транспорт' })).toBeVisible()
  await expect(page.getByText('Шаг 2 из 6')).toBeVisible()
  await page.getByRole('button', { name: 'Назад' }).click()
  await expect(page).toHaveURL(/\/demo\/profile$/)
  await expect(
    page.getByRole('dialog', { name: 'Начните с первого объявления' }),
  ).toBeVisible()
})

test('demo uses fictional profile data and an empty phone field', async ({
  page,
}) => {
  await page.goto('/demo/profile')
  await expect(
    page.getByRole('heading', { name: 'Марина Волкова' }),
  ).toBeVisible()

  await page.goto('/demo/new/auto')
  await expect(page.getByPlaceholder('Номер телефона')).toHaveValue('')
})

test('completed demo can be restarted from the final dialog', async ({ page }) => {
  await page.goto('/demo/profile')
  await completeDemo(page)

  const completedDialog = page.getByRole('dialog', { name: 'Демо завершено' })
  await expect(completedDialog).toBeVisible()
  await completedDialog.getByRole('button', { name: 'Повторить демо' }).click()

  await expect(page).toHaveURL(/\/demo\/profile$/)
  await expect(
    page.getByRole('dialog', { name: 'Начните с первого объявления' }),
  ).toBeVisible()

  await completeDemo(page)
  await page
    .getByRole('dialog', { name: 'Демо завершено' })
    .getByRole('button', { name: 'Вернуться на главную' })
    .click()

  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole('heading', {
      name: 'Помогайте пользователям двигаться дальше',
    }),
  ).toBeVisible()
})

test('admin layout remains usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Фабрика сценариев' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Сценарии' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Шаги' })).toBeVisible()

  await page.getByRole('button', { name: 'Как создать сценарий' }).click()
  const dialog = page.getByRole('dialog', { name: 'Как создать сценарий' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Основные понятия')
  await expect(dialog).toContainText('Опубликуйте и следите за результатом')

  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
})

test('creation guide explains the full administrator workflow', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Как создать сценарий' }).click()

  const dialog = page.getByRole('dialog', { name: 'Как создать сценарий' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Один сценарий относится к одной странице')
  await expect(dialog).toContainText(
    'После публикации SDK начнёт отдавать сценарий пользователям',
  )
  await expect(dialog.getByRole('button', { name: 'Далее' })).toHaveCount(0)
})

test('journey map follows a live onboarding session without storing analytics', async ({
  page,
}) => {
  await page.goto('/admin/journey')

  await expect(
    page.getByRole('heading', { name: 'Journey Map', exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('journey-canvas')).toBeVisible()
  await expect(
    page
      .getByTestId('rf__node-scenario-first-listing-profile')
      .getByText('Первое объявление: профиль', { exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Начать отсюда' }).click()
  const demo = page.frameLocator('iframe[title="Интерактивное демо пользовательского пути"]')
  await expect(demo.getByRole('dialog', { name: 'Начните с первого объявления' })).toBeVisible()
  await demo.getByRole('button', { name: 'Далее' }).click()

  await expect(demo.getByRole('dialog', { name: 'Выберите транспорт' })).toBeVisible()
  await expect(page.getByText('Подсказка показана').first()).toBeVisible()
  await expect(
    page
      .getByTestId('rf__node-scenario-first-listing-category')
      .getByText('Первое объявление: категория', { exact: true }),
  ).toBeVisible()

  const storedEvents = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('interactive-onboarding:events:v2') ?? '[]'),
  )
  expect(storedEvents).toEqual([])
})

test('journey map remains coherent on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/journey')

  await expect(page.getByRole('tab', { name: 'Карта' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Демо' })).toBeVisible()
  await expect(page.getByTestId('journey-canvas')).toBeVisible()

  await page.getByRole('tab', { name: 'Демо' }).click()
  await expect(page.getByText('Пройдите путь глазами пользователя')).toBeVisible()
})

test('journey map opens the selected scenario in the existing editor', async ({
  page,
}) => {
  await page.goto('/admin/journey')

  await page.getByRole('button', { name: 'Открыть сценарий' }).click()

  await expect(page).toHaveURL(
    /\/admin\?scenarioId=scenario-first-listing-profile$/,
  )
  await expect(
    page.getByRole('heading', { name: 'Фабрика сценариев' }),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Название сценария' })).toHaveValue(
    'Первое объявление: профиль',
  )
})

test('journey nodes can be rearranged and restored to the automatic layout', async ({
  page,
}) => {
  await page.goto('/admin/journey')

  const node = page.getByTestId('rf__node-scenario-first-listing-profile')
  await expect(node).toBeVisible()
  const initialPosition = await node.boundingBox()
  expect(initialPosition).not.toBeNull()

  await page.mouse.move(
    initialPosition!.x + initialPosition!.width / 2,
    initialPosition!.y + initialPosition!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    initialPosition!.x + initialPosition!.width / 2 + 110,
    initialPosition!.y + initialPosition!.height / 2 + 90,
    { steps: 10 },
  )
  await page.mouse.up()

  await expect.poll(async () => (await node.boundingBox())?.x).toBeGreaterThan(
    initialPosition!.x + 60,
  )

  await page.getByRole('button', { name: 'Выровнять' }).click()
  await expect.poll(async () => (await node.boundingBox())?.x).toBeCloseTo(
    initialPosition!.x,
    0,
  )
})

async function completeDemo(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page).toHaveURL(/\/demo\/new$/)
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page).toHaveURL(/\/demo\/new\/transport$/)
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page).toHaveURL(/\/demo\/new\/auto$/)

  for (let step = 0; step < 3; step += 1) {
    await page.getByRole('button', { name: 'Далее' }).click()
  }
}
