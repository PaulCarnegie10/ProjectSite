# Content schema & team interfaces (FROZEN)

This document is the interface contract between Team Site (content engine +
pages) and Team Edit (dev-only edit layer). Neither team changes these shapes
unilaterally; changes go through the manager.

## 1. Content layout

All user-visible text and media live under `content/`:

```
content/
  site/
    home.json        hero + intro + socials + featured project slugs
    nav.json         nav links
    skills.json      skill categories
    about.json       stub page text
    experience.json  stub page text
  projects/
    <slug>/          slug = kebab-case folder name, becomes the route
      index.md       frontmatter + markdown body (owner's own wording)
      *.png|jpg|webp images referenced by filename in frontmatter
      *.mp4          videos referenced by filename in frontmatter
      *.pdf          linked documents (e.g. poster)
```

### 1.1 `index.md` frontmatter

```yaml
---
title: string            # required
blurb: string            # card text + detail subtitle
date: "YYYY-MM"          # display only
tags: [string]
order: 1                 # ascending sort on the Projects grid
draft: false             # true = hidden from grid and routes
hero: "cover.png"        # filename in this folder, optional
gallery: ["a.png", "b.png"]   # optional
videos: ["demo.mp4"]          # optional
links:                        # optional
  - { label: "GitHub", url: "https://..." }
---
Markdown body. Code fences allowed. This text is the owner's own wording —
agents never rewrite it; unfinished sections carry the marker `[TODO — Paul]`.
```

`order` is 1-based and contiguous across non-draft projects; the reorder
endpoint rewrites it wholesale. `links[].url` may be an external URL or a
relative filename in the project folder (e.g. `"./poster.pdf"`) — the loader
resolves relative link urls to servable URLs.

### 1.2 `site/*.json` shapes

- `home.json`: `{ heroTitle, heroSubtitle, intro, socials: [{label, url, kind}], featuredSlugs: [string], infoCards: [{label, value}] }`
  (`kind` in `github|linkedin|email` — Site team maps to icons; `infoCards` optional)
- `nav.json`: `{ links: [{label, path, blurb}] }` (`blurb` optional)
- `skills.json`: `{ categories: [{ name, note, skills: [{name, level, note}] }] }` (`level` 0–100; category `note` optional)
- `about.json`, `experience.json`: `{ title, body }` (body = markdown string)

## 2. Loader API — owned by Team Site (`src/content/loader.js`)

```js
getProjects()        // Project[], order-sorted, drafts excluded
getProject(slug)     // Project | undefined (drafts included in dev)
getSiteText(name)    // parsed object for content/site/<name>.json
```

`Project`: `{ slug, title, blurb, date, tags, order, draft, heroUrl,
gallery: [{src, name}], videos: [{src, name}], links, body /* markdown */ }`.
Media filenames resolve to servable URLs via `import.meta.glob`. Content reads
must be glob-based so a NEW project folder appears with zero code changes.

## 3. Edit primitives — owned by Team Edit (`src/edit/`)

Team Site imports ONLY from `src/edit/index.jsx` and binds every user-visible
string/media slot. A committed no-op stub keeps Site compiling before the real
implementation lands. In production builds (`import.meta.env.PROD`) all
primitives render inert output with zero edit code in the bundle.

### 3.1 Content paths

A content path is a single string: `<file relative to content/>#<key>`.

- JSON: `site/home.json#heroTitle`, nested via dots: `site/skills.json#categories.0.name`
- Frontmatter: `projects/bee-tracker/index.md#title`
- Markdown body: `projects/bee-tracker/index.md#body`

### 3.2 Components

```jsx
<Editable path as="h1|p|span|..." multiline={bool}>{currentValue}</Editable>
<EditableImage path src alt className />        // drop target replaces file + frontmatter
<EditableGallery path items={[{src,name}]} renderItem />  // drop adds; per-item remove
<EditableVideos path items={[{src,name}]} renderItem />   // drop adds (auto-compressed); per-item remove
// renderItem(item, i) is optional; when given, it renders each item.
<EditToolbar />                                 // mounted once in App.jsx (dev only):
                                                // edit-mode toggle, Add Project, reorder, delete
```

## 4. Dev edit API — owned by Team Edit (`tools/edit-server/`)

Vite dev-server middleware, dev only, same-origin under `/__edit/*`. All
responses `application/json`: success `{ok:true, ...}`, failure
`{ok:false, error:<code>, message}` with codes `not_loopback`(403),
`bad_path`(400), `not_found`(404), `too_large`(413),
`unsupported_media`(415), `encode_failed`(500).

```
GET    /__edit/ping                          -> {ok, contentRoot, ffmpeg:bool, sharp:bool}
POST   /__edit/text    {path, value}         -> {ok, path, value}
POST   /__edit/asset   multipart: path, file -> {ok, name, kind:"image"|"video", bytesIn, bytesOut, path}
DELETE /__edit/asset   {path, name}          -> {ok, path, items:[...]}   // frontmatter-only removal; file stays on disk
POST   /__edit/project {title}               -> {ok, slug}
DELETE /__edit/project {slug}                -> {ok, slug, trashed:"<rel path>"}  // moves folder to content/.trash/<slug>-<epoch>/
POST   /__edit/reorder {slugs:[...]}         -> {ok, orders:{slug:number}}
```

Asset `path` keys: `#hero` (replace), `#gallery` (append), `#videos`
(append). Image uploads are converted to `.webp` (q82, max dimension
2000px). Videos are compressed to H.264 ≤10MB. Body caps: 1 MB JSON,
512 MB multipart. The server accepts URLs bare (`/__edit/x`) and
base-prefixed (`/ProjectSite/__edit/x`); clients fetch bare root-relative.
PDF uploads are unsupported in v1 (reject `unsupported_media`); owners copy
PDFs into the project folder manually.

Security requirements (blocking): reject any request whose socket peer
address is not loopback (127.0.0.1 / ::1 / ::ffff:127.0.0.1) — never trust
Host/X-Forwarded-For/Origin; every write jailed to `content/` (reject
traversal); sanitized filenames; ffmpeg/sharp invoked with argument arrays,
never a shell string; request body size caps.

## 5. Shared-file rules

- `package.json` / `vite.config.js`: both teams may edit IN THEIR OWN WORKTREE;
  the manager resolves these two files at integration. Keep changes minimal.
- All other files: Team Site owns `content/`, `src/` (except `src/edit/`),
  `public/`, `index.html`. Team Edit owns `src/edit/`, `tools/`,
  `docs/EDITING.md`. No exceptions without manager sign-off.
