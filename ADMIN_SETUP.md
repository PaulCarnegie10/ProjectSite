# Content Manager (/admin)

The site has a CMS at **https://paulcarnegie10.github.io/ProjectSite/admin/**.
Sign in with GitHub (only accounts with write access to this repo can edit).
Every save becomes a git commit to `main`, and GitHub Actions rebuilds and
publishes the site automatically (~2 minutes).

Setup is COMPLETE (2026-07-03). For reference, the moving parts:

- **Auth worker**: `https://sveltia-cms-auth.paulcolombo.workers.dev` —
  Cloudflare Worker (project `sveltia-cms-auth`, repo
  `PaulCarnegie10/sveltia-cms-auth`). Holds `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET` (encrypted), and `ALLOWED_DOMAINS=paulcarnegie10.github.io`.
- **GitHub OAuth app**: "ProjectSite CMS" (github.com → Settings →
  Developer settings → OAuth Apps), callback = worker URL + `/callback`.
- **CMS config**: `public/admin/config.yml` (`base_url` points at the worker).
- **workers.dev subdomain**: `paulcolombo.workers.dev` (account-level).

If the secret ever leaks or breaks: generate a new client secret on the
OAuth app page, then `printf '<secret>' | npx wrangler secret put
GITHUB_CLIENT_SECRET --name sveltia-cms-auth`.

## Local editing (no sign-in needed)

1. `npm run dev`
2. Open http://localhost:5173/ProjectSite/admin/
3. Click **Work with Local Repository** and select the `ProjectSite` folder.
4. Edits write straight to `src/content/` — commit and push when happy.

## Notes

- Content lives in `src/content/` (projects, news, skills as JSON).
  `src/data/*.js` are just loaders — don't put content there anymore.
- Media uploads land in `public/projects/`. **Compress screen recordings
  before uploading** (a 2-minute 1440p capture can be 90+ MB raw; ffmpeg
  at 720p/CRF 28 gets it near 1 MB).
- `npm run deploy` is no longer needed — every push to `main` deploys via
  `.github/workflows/static.yml`.
