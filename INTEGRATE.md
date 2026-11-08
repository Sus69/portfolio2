# Integrate — Whimsical Editorial theme for portfolio2

Ready to apply on your own machine. No GitHub push was done from this
copy — the parent agent will push via the GitHub connector after the
theme is committed.

## What you have

- This folder (`portfolio2-theme`) is the fully themed working copy.
- `portfolio2-whimsical-editorial.patch` (next to this repo, in
  `~/workspace/`) is the same change as a patch, generated from commit
  `5f66ed2ffd1fc0ae624dcdde672a037af282d1e5`
  ("feat: add interactive fluid identity reveal hero section").
- `THEME.md` in the repo root documents the palette, fonts, and
  per-section mapping, including the hero section.

## Option A — apply the patch (recommended, 3 steps)

1. Copy the patch into your local `portfolio2` repo:
   ```bash
   cp ~/workspace/portfolio2-whimsical-editorial.patch /path/to/portfolio2/
   cd /path/to/portfolio2
   ```
2. Check it applies cleanly, then apply it:
   ```bash
   git apply --check portfolio2-whimsical-editorial.patch
   git apply portfolio2-whimsical-editorial.patch
   git status --short
   ```
   You should see 14 modified files plus 5 new files:
   `card-section/src/components/ThemeCat.tsx`,
   `txt-img-cvrt-section/src/components/ThemeCat.tsx`,
   `ftr-sprze-section/src/components/ThemeCat.tsx`, plus `THEME.md`
   and this `INTEGRATE.md`. The hero changes are the 2 modified
   files `hero-section/index.html` and `hero-section/style.css`.
3. Install and build to verify:
   ```bash
   npm install
   npm run build
   ```
   Or run one section at a time:
   ```bash
   npm run dev:cards      # card-section
   npm run dev:projects   # txt-img-cvrt-section
   npm run dev:footer     # ftr-sprze-section
   ```
   The hero section has no build script — serve it with
   `npm start` inside `hero-section/` (or `python -m http.server`).

If `git apply` complains, your local copy has diverged from commit
`5f66ed2` — use Option B instead, and check the conflicting file by hand.

## Option B — copy the folders over

Copy these over your local repo (same commit `5f66ed2` as the base):

- `card-section/`
- `txt-img-cvrt-section/`
- `ftr-sprze-section/`
- `hero-section/`
- `THEME.md`, `INTEGRATE.md`

Then run `npm install && npm run build` as in step 3 above.

## After it builds

```bash
git add -A
git commit -m "feat: apply Whimsical Editorial theme"
git push
```

Push from your own machine / your own `Sus69` login, as usual.

## If a build fails locally

The three workspaces were each built clean here before the patch was
made. A local failure is most likely a stale `node_modules` — try
`rm -rf node_modules */node_modules && npm install` and build again.
