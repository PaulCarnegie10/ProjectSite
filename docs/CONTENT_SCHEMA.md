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

### 1.2 `site/*.json` shapes

- `home.json`: `{ heroTitle, heroSubtitle, intro, socials: [{label, url, kind}], featuredSlugs: [string] }`
  (`kind` in `github|linkedin|email` — Site team maps to icons)
- `nav.json`: `{ links: [{label, path}] }`
- `skills.json`: `{ categories: [{ name, skills: [{name, level, note}] }] }` (`level` 0–100)
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
<EditableGallery path items={[{src,name}]} />   // drop adds; per-item remove
<EditableVideos path items={[{src,name}]} />    // drop adds (auto-compressed); per-item remove
<EditToolbar />                                 // mounted once in App.jsx (dev only):
                                                // edit-mode toggle, Add Project, reorder, delete
```

## 4. Dev edit API — owned by Team Edit (`tools/edit-server/`)

Vite dev-server middleware, dev only, same-origin under `/__edit/*`:

- `POST /__edit/text`        `{path, value}` → writes JSON key / frontmatter key / md body
- `POST /__edit/asset`       multipart `{path, file}` → compresses (sharp for images;
                             ffmpeg-static → H.264 ≤10MB for video), writes into the
                             project folder, updates frontmatter list/key
- `POST /__edit/project`     `{title}` → scaffolds `content/projects/<slug>/index.md`
- `DELETE /__edit/project`   `{slug}`
- `POST /__edit/reorder`     `{slugs: [...]}` → rewrites `order` frontmatter

Security requirements (blocking): serve on 127.0.0.1 only; every write jailed
to `content/` (reject traversal); sanitized filenames; ffmpeg/sharp invoked
with argument arrays, never a shell string; request body size caps.

## 5. Shared-file rules

- `package.json` / `vite.config.js`: both teams may edit IN THEIR OWN WORKTREE;
  the manager resolves these two files at integration. Keep changes minimal.
- All other files: Team Site owns `content/`, `src/` (except `src/edit/`),
  `public/`, `index.html`. Team Edit owns `src/edit/`, `tools/`,
  `docs/EDITING.md`. No exceptions without manager sign-off.
