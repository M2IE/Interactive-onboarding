import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { background: 'src/background/index.ts' },
    clean: false,
    dts: false,
    format: ['esm'],
    outDir: 'dist',
    platform: 'browser',
    splitting: false,
    target: 'chrome116',
  },
  {
    entry: { content: 'src/content/index.ts' },
    clean: false,
    dts: false,
    format: ['iife'],
    globalName: 'M2IEOnboardingStudio',
    minify: true,
    noExternal: [/.*/],
    outDir: 'dist',
    platform: 'browser',
    splitting: false,
    target: 'chrome116',
  },
])
