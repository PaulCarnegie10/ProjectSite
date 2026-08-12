// No-op stubs for the dev-only edit layer (contract: docs/CONTENT_SCHEMA.md §3).
// Team Edit replaces the internals; the exported API is frozen. In production
// builds these must contribute zero edit behavior to the bundle.

export function Editable({ as: Tag = 'span', children, className, ...rest }) {
  void rest;
  return <Tag className={className}>{children}</Tag>;
}

export function EditableImage({ src, alt = '', className }) {
  return <img src={src} alt={alt} className={className} />;
}

export function EditableGallery({ items = [], renderItem }) {
  return <>{items.map((item, i) => renderItem ? renderItem(item, i) : null)}</>;
}

export function EditableVideos({ items = [], renderItem }) {
  return <>{items.map((item, i) => renderItem ? renderItem(item, i) : null)}</>;
}

export function EditToolbar() {
  return null;
}
