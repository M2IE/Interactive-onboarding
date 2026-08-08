import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const resolveFromRoot = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@interactive-onboarding/onboarding-sdk/react',
        replacement: resolveFromRoot('packages/onboarding-sdk/src/react/index.ts'),
      },
      {
        find: '@interactive-onboarding/onboarding-sdk',
        replacement: resolveFromRoot('packages/onboarding-sdk/src/index.tsx'),
      },
      {
        find: '@interactive-onboarding/shared',
        replacement: resolveFromRoot('packages/shared/src/index.ts'),
      },
      {
        find: '@interactive-onboarding/ui',
        replacement: resolveFromRoot('packages/ui/src/index.tsx'),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
})
