import { defineConfig } from 'vite'

export default defineConfig({
  // Vite ^5.2.0 + TypeScript ^5.4.5 - build tool and dev server configuration
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
})
