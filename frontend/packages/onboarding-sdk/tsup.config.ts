import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: {
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts',
  },
  external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  sourcemap: true,
  splitting: false,
  target: 'es2020',
  treeshake: true,
})
