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
    // Narrowed from the whole repo to just what the harness serves: its own
    // root, the code under test, and the dependency store.
    fs: {
      allow: [here, path.join(repoRoot, 'src/edit'), path.join(repoRoot, 'node_modules')],
    },
  },
  build: {
    outDir: path.join(here, 'dist'),
    emptyOutDir: true,
  },
});
