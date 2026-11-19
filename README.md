# Vice City Cover Studio

A free, offline web app that turns your photo and a caption into multi-panel
cover art in the style of GTA 6 posters — a Vice City sunset or neon colour
grade, bold caption lettering, exported as a PNG to share. Built for the
make.fun bounty `gta6-cover-art-01`.

## How to use it

1. Open `app/index.html` in desktop Chrome (or serve `app/` with any static
   server — no build step, no network requests, no upload).
2. Pick a layout: **Hero + Three**, **Four Corners**, or **Big Top + Strip**.
3. Load photos: up to 4, one per panel, or tick **One photo fills every
   panel** to spread a single photo across the cover. Click a panel in the
   preview to select it, drag to pan the photo inside it, use **Zoom** to
   crop, **Reset crop** to start over. **Load sample photos** fills the
   panels with two procedurally drawn scenes (sunset boulevard, neon street)
   so you can try it with no photo at all.
4. Type a caption and a subtitle; pick a lettering style (sunset gradient,
   solid white, neon outline) and a colour grade (Vice Sunset, Neon Night,
   Golden Hour, Midnight Noir).
5. Pick a size — **1080 × 1080**, **1080 × 1350** or **1920 × 1080** — and
   press **Export PNG**.

Photos are read on your own machine and never uploaded anywhere.

## How it works

- `app/src/cover.js` — the cover engine: panel geometry, cover-fit photo
  drawing with per-panel pan/zoom crops, gradient-map colour grades, the
  bold title block with diagonal accent stripes, film grain and vignette.
- `app/src/sample.js` — the sample photos: a sunset boulevard and a neon
  night street, drawn procedurally on canvas (sky gradients, sun, skyline,
  palms, a convertible silhouette). No photograph of a real person.
- `app/src/main.js` — the editor wiring: uploads, panel picking, controls,
  live preview, PNG export.
- `app/src/shots.js` — fixed screenshot scenes (`?shot=editor`,
  `?shot=cover`).
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` with the kit's
  `vendor/makefun-app.ts` library.

## Originality

Everything visual is this app's own: the panel layouts, the grades, the
lettering and the sample scenes are drawn by its code. It uses no Rockstar
Games logo, wordmark, official artwork, character or font — lettering is
styled system fonts only, and no font file is shipped.

## License

MIT — see [LICENSE](LICENSE).
