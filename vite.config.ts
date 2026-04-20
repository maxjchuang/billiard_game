import { defineConfig } from 'vite'

const DEFAULT_PAGES_BASE = '/billiard_game/'

export default defineConfig(({ command }) => {
  const base = command === 'build' ? process.env.BASE_PATH ?? DEFAULT_PAGES_BASE : '/'

  return {
    base,
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true
    },
    build: {
      outDir: 'dist-web',
      emptyOutDir: true
    }
  }
})
