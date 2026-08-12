import { copyFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-manifest',
      closeBundle() {
        copyFileSync(
          fileURLToPath(new URL('./manifest.json', import.meta.url)),
          fileURLToPath(new URL('./dist/manifest.json', import.meta.url)),
        )
      },
    },
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: fileURLToPath(new URL('./sidepanel.html', import.meta.url)),
    },
  },
})
