import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const API_ORIGIN = 'https://eternal-happiness2026-svc.shamiahmacawilimendoza0809.workers.dev'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: API_ORIGIN,
        changeOrigin: true,
      },
      '/media': {
        target: API_ORIGIN,
        changeOrigin: true,
      },
    },
  },
})
