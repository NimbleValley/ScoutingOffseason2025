import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/ScoutingOffseason2025/',
  plugins: [react(), tailwindcss(),],
  server: {
    host: true, // makes dev server accessible on LAN
    port: 5173, // optional, default is 5173
  },
})
