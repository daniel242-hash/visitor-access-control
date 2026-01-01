import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'visitor-access-control-production-95b8.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
