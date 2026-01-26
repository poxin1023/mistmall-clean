import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://mistmall-clean.pubg1023pubg.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
