import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Сбросить' }).click()
})

test('administrator edits, validates and saves a scenario', async ({ page }) => {
  await page.getByRole('button', { name: 'Создать сценарий' }).click()

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
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page).toHaveURL(/\/demo\/new$/)

  await expect(page.getByRole('dialog', { name: 'Выберите транспорт' })).toBeVisible()
  await page.getByRole('button', { name: 'Назад' }).click()
  await expect(page).toHaveURL(/\/demo\/profile$/)
  await expect(
    page.getByRole('dialog', { name: 'Начните с первого объявления' }),
  ).toBeVisible()
})

test('admin layout remains usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Фабрика сценариев' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Сценарии' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Шаги' })).toBeVisible()
})
