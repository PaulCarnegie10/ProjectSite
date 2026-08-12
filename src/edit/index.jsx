// Dev-only edit layer (contract: docs/CONTENT_SCHEMA.md §3).
//
// This file is the ONLY entry point Team Site imports from, and its export
// names + prop names are frozen. Everything real lives under ./dev/ and is
// reached exclusively through `import.meta.env.DEV` branches.
//
// Production inertness: Vite replaces `import.meta.env.DEV` with `false` in a
// build, Rollup drops the dead branches, the ./dev/* bindings become unused,
// and because every dev module is free of top-level side effects (no CSS
// imports, no top-level calls) the modules themselves are eliminated. After
// `npm run build`, neither "__edit" nor "__EDIT_DEV_ONLY__" appears in dist/.
//
// Adding OPTIONAL props here is allowed; renaming or removing anything is not.

import { Fragment } from 'react';
import { DevEditableGallery, DevEditableImage, DevEditableVideos } from './dev/Assets.jsx';
import { DevEditable } from './dev/Editable.jsx';
import { DevEditToolbar } from './dev/Toolbar.jsx';

/**
 * Editable text slot.
 * @param {object} p
 * @param {string} [p.as] tag name, default 'span'
 * @param {string} p.path content path, e.g. 'site/home.json#heroTitle'
 * @param {boolean} [p.multiline] use an overlaid textarea instead of in-place editing
 * @param {string} [p.className]
 * @param {import('react').ReactNode} [p.children] current value, as rendered
 * @param {string} [p.rawValue] OPTIONAL edit buffer. Pass this whenever `children`
 *   are rendered output rather than the source string — notably a markdown-rendered
 *   project #body, where reading innerText back would mangle the markdown. When it
 *   is absent the editor falls back to children-as-text for plain strings.
 */
export function Editable({ as: Tag = 'span', path, multiline, className, children, rawValue }) {
  if (import.meta.env.DEV) {
    return (
      <DevEditable
        as={Tag}
        path={path}
        multiline={multiline}
        className={className}
        rawValue={rawValue}
      >
        {children}
      </DevEditable>
    );
  }
  return <Tag className={className}>{children}</Tag>;
}

/** Single image slot. Drop replaces the file and rewrites frontmatter. */
export function EditableImage({ path, src, alt = '', className }) {
  if (import.meta.env.DEV) {
    return <DevEditableImage path={path} src={src} alt={alt} className={className} />;
  }
  // Contract §3.2: a falsy src renders nothing. An empty src="" would make the
  // browser re-fetch the whole page and paint a broken-image icon.
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
}

/** Image list slot. Drop appends; each item gets a remove control. */
export function EditableGallery({ path, items = [], renderItem }) {
  if (import.meta.env.DEV) {
    return <DevEditableGallery path={path} items={items} renderItem={renderItem} />;
  }
  return (
    <>
      {items.map((item, i) => (
        <Fragment key={item?.name ?? i}>{renderItem ? renderItem(item, i) : null}</Fragment>
      ))}
    </>
  );
}

/** Video list slot. Drop appends (server re-encodes); each item gets a remove control. */
export function EditableVideos({ path, items = [], renderItem }) {
  if (import.meta.env.DEV) {
    return <DevEditableVideos path={path} items={items} renderItem={renderItem} />;
  }
  return (
    <>
      {items.map((item, i) => (
        <Fragment key={item?.name ?? i}>{renderItem ? renderItem(item, i) : null}</Fragment>
      ))}
    </>
  );
}

/**
 * Edit-mode toggle + Add / Reorder / Delete project.
 * Mount once. Optional `projects` is a slug list; without it the toolbar reads
 * project slugs off the page's own links.
 */
export function EditToolbar({ projects } = {}) {
  if (import.meta.env.DEV) {
    return <DevEditToolbar projects={projects} />;
  }
  return null;
}
