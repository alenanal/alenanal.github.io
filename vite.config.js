import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // respect an assigned PORT (e.g. from preview tooling); default to 5173
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        basic: 'basic.html', // the no-game, straight-to-the-point version
      },
    },
  },
})
