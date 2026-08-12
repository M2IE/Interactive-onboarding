import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5179',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'VITE_API_MODE=mock VITE_ONBOARDING_PROJECT_KEY=avito-demo npx vite --host 127.0.0.1 --port 5179',
    cwd: './apps/web',
    url: 'http://127.0.0.1:5179/admin',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'web',
      testMatch: /web\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'extension',
      testMatch: /extension\.spec\.ts/,
    },
  ],
})
