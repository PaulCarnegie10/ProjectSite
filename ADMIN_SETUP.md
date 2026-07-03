# Content Manager (/admin) — one-time setup

The site has a CMS at **https://paulcarnegie10.github.io/ProjectSite/admin/**.
Every save in the CMS becomes a git commit to `main`, and GitHub Actions
rebuilds and publishes the site automatically (~2 minutes).

Editing works two ways:

## A. Local editing (works right now, no setup)

1. `npm run dev`
2. Open http://localhost:5173/ProjectSite/admin/
3. Click **Work with Local Repository** and select the `ProjectSite` folder.
4. Edits write straight to `src/content/` — commit and push when happy.

## B. Editing from anywhere (needs ~10 minutes of one-time setup)

The deployed /admin signs you in with GitHub. GitHub Pages can't hold the
OAuth secret, so a tiny free Cloudflare Worker does the handshake.

1. **Deploy the auth worker** — go to
   https://github.com/sveltia/sveltia-cms-auth and click
   "Deploy to Cloudflare Workers" (free Cloudflare account is fine).
   Copy the worker URL, e.g. `https://sveltia-cms-auth.YOURNAME.workers.dev`.

2. **Create a GitHub OAuth app** — GitHub → Settings → Developer settings →
   OAuth Apps → New OAuth App:
   - Homepage URL: `https://paulcarnegie10.github.io/ProjectSite/`
   - Authorization callback URL: `<YOUR_WORKER_URL>/callback`
   Register it, copy the **Client ID**, and generate a **Client Secret**.

3. **Configure the worker** — Cloudflare dashboard → your worker →
   Settings → Variables. Add:
   - `GITHUB_CLIENT_ID` = the Client ID
   - `GITHUB_CLIENT_SECRET` = the Client Secret (use the Encrypt button)

4. **Point the CMS at the worker** — in `public/admin/config.yml`, replace
   the placeholder `base_url` with your worker URL and push (or tell Claude
   the URL and it'll do it).

5. Open https://paulcarnegie10.github.io/ProjectSite/admin/ → **Sign In
   with GitHub**. Only accounts with write access to this repo can edit —
   that's you.

## Notes

- Content lives in `src/content/` (projects, news, skills as JSON).
  `src/data/*.js` are just loaders — don't put content there anymore.
- Media uploads land in `public/projects/`. **Compress screen recordings
  before uploading** (a 2-minute 1440p capture can be 90+ MB raw; ffmpeg
  at 720p/CRF 28 gets it near 1 MB).
- `npm run deploy` is no longer needed — every push to `main` deploys via
  `.github/workflows/static.yml`.
