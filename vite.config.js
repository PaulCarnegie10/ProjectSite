import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import editServer from './tools/edit-server/index.js'

// https://vite.dev/config/
export default defineConfig({
  base: '/ProjectSite/',
  plugins: [react(), editServer()],
    build: {
      outDir: 'dist',
    },
})
