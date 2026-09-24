import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forwards to api/dev-server.js (run separately: npm run dev:api)
      // so the browser sees /api/* as same-origin, matching production.
      '/api': 'http://127.0.0.1:4000',
    },
  },
})
