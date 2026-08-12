// Standalone harness for the dev edit layer.
//
//   npx vite --config tools/edit-harness/vite.config.js          # dev, mock server on
//   npx vite build --config tools/edit-harness/vite.config.js    # prod inertness check
//
// Deliberately does NOT reuse the site's vite.config.js: the harness must
// exercise src/edit/ on its own, and the edit chrome must not depend on the
// site's tailwind setup.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockEditServer } from './mock-server.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

export default defineConfig({
  root: here,
  base: '/',
  plugins: [react(), mockEditServer()],
  resolve: {
    alias: { '@edit': path.join(repoRoot, 'src/edit') },
  },
  server: {
    port: 5199,
    strictPort: false,
    fs: { allow: [repoRoot] },
  },
  build: {
    outDir: path.join(here, 'dist'),
    emptyOutDir: true,
  },
});
