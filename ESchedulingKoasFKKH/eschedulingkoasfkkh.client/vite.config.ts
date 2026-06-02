import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy: request ke /api/* akan diteruskan ke ASP.NET backend
    // Jadi fetch('/api/stase') di React → dikirim ke http://localhost:5025/api/stase
    proxy: {
      '/api': {
        target: 'http://localhost:5025',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
