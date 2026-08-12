import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import editServer from './tools/edit-server/index.js'

// https://vite.dev/config/
export default defineConfig({
  base: '/ProjectSite/',
  plugins: [react(), editServer()],
  // Scope dependency scanning to the real app entry. Without this the scanner
  // also walks tools/edit-harness/, whose @edit alias only exists in the
  // harness config, and pre-bundling is skipped site-wide.
  optimizeDeps: { entries: ['index.html'] },
    build: {
      outDir: 'dist',
    },
})
