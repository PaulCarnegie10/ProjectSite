// Vite plugin: the dev-only edit API described in docs/CONTENT_SCHEMA.md §4.
//
// apply: 'serve' means this never participates in a production build, so no
// edit code and no `__edit` string can reach dist/.

import path from 'node:path';
import process from 'node:process';
import { createEditMiddleware } from './lib/middleware.js';

export { createEditMiddleware } from './lib/middleware.js';

/**
 * @param {{contentRoot?: string}} [options]
 *   contentRoot defaults to <vite root>/content; process.env.EDIT_CONTENT_ROOT
 *   overrides it (the test suite points this at a temp directory).
 */
export default function editServer(options = {}) {
  return {
    name: 'portfolio-edit-server',
    apply: 'serve',
    configureServer(server) {
      const contentRoot = path.resolve(
        options.contentRoot
        || process.env.EDIT_CONTENT_ROOT
        || path.join(server.config.root, 'content'),
      );
      server.middlewares.use(createEditMiddleware({ contentRoot }));
      server.config.logger.info(`  edit api  /__edit/*  ->  ${contentRoot}`);
    },
  };
}
