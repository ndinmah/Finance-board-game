import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/colyseus': {
        target: 'http://127.0.0.1:2567',
        changeOrigin: true,
        ws: true,
        rewrite: path => path.replace(/^\/colyseus/, ''),
      },
    },
  },
})
