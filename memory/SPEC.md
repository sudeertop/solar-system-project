# Güneş Sistemi'ni Keşfet — SPEC

Turkish interactive astronomy site. **Plain multi-page HTML/CSS/JS + Three.js** (no framework
router, no migration). Two codebases are integrated:

1. **The user's real repository** (`github.com/sudeertop/solar-system-project`, branch `emergent`) —
   the developed Sun/Moon/Mars/Saturn exploration modules. Copied verbatim into
   `frontend/public/` as `pages/`, `css/`, `js/`, `assets/`.
2. **The entrance + hub built in this task** — `frontend/index.html` and
   `frontend/solar-system.html` (the repo's own `pages/index.html`,
   `pages/solar-system.html` and `pages/space101.html` were 0-byte stubs).

## Routes

| URL | Source | Role |
|---|---|---|
| `/` | `frontend/index.html` + `src/site/entrance.js` | Entrance. `BAŞLA` → `/solar-system.html`, quiet `UZAYI ANLA` → `/space101.html`. 2D canvas backdrop only — no Three.js, no GLB, stays lightweight. |
| `/solar-system.html` | `frontend/solar-system.html` + `src/site/solar-system.js` | The 3D hub. |
| `/pages/sun.html` | **user's real module** | `js/sun.js` + `sun-spacecraft.js` + `sun-features.js`; sun.glb, Parker/SOHO/Solar Orbiter GLBs, real ephemeris trajectories. |
| `/pages/moon.html` | **user's real module** | `js/moon.js` + `lro.js`; moon.glb (81 MB), crater markers, LRO live clock, Earth comparison. |
| `/pages/mars.html` | **user's real module** | `js/mars.js` + `mars-moons.js` + `mars-compare.js`; mars.glb, Phobos, Deimos, surface points. |
| `/pages/saturn.html` | **user's real module** | `js/saturn.js` + `saturn-moons.js`; saturn.glb, ring regions, 7 moons, time-warp control. |
| `/space101.html` | minimal stub | "UZAYI ANLA" — **intentionally deferred** by the user to a later phase. Do not build content here. |

Why the real modules live in `public/`: they load Three.js 0.185.1 from their own CDN importmap
and use their own relative asset paths, so serving them byte-for-byte (no Vite processing) is what
keeps them working. **They are deliberately not Vite entries.**

### Path convention discovered (important)
- Sun module uses **root-absolute** `/assets/...` paths.
- Moon/Mars/Saturn use **relative** `../assets/...`.
Placing the repo at the web root satisfies both — do not move `assets/` or `pages/`.

## Two click behaviours (core requirement)

- **Category A — navigate to the real module:** Güneş, Ay, Mars, Satürn (`mode: "page"`).
- **Category B — panel only:** Merkür, Venüs, Dünya, Jüpiter, Uranüs, Neptün (`mode: "panel"`).
  Only `#panel-body` re-renders; no camera flight, scene keeps its viewing context. Selection
  feedback = camera-facing hairline reticle + label emphasis.
- `Genel` (`#panel-reset`) restores the overview panel.

## Orbital distance mapping (scientifically honest, not to scale)

`src/site/bodies.js` derives every orbit radius from the **real semi-major axis in AU**:

```
r(scene) = 15.0 * a_AU ^ 0.58
```

One uniform power law — monotonic (order always correct), no per-planet fudging. Measured on this
mapping the **Uranus→Neptune gap is 9.6x the Venus→Earth gap** (true linear 39.3x; a log10 mapping
would crush it to 1.4x, making gaps look nearly equal — the thing to avoid). Body radii are
compressed separately and far more aggressively, so sizes and distances are NOT on one scale. The
UI states this in the scene note.

Orbital rate: `period^-0.7` — Mercury ~2.7x faster than Earth, Neptune ~36x slower. Real `^-1`
would leave Neptune frozen; equal speeds would be false.

## Scene technical

WebGLRenderer with `outputColorSpace = SRGBColorSpace`, `setPixelRatio(min(dpr, 2))`, ACES tone
mapping. OrbitControls with damping, `minDistance 16` / `maxDistance 900`, pan disabled. Camera
auto-frames the full disc out to Neptune for any aspect ratio (`frameSystem()`), recomputed on
resize until the user takes over the camera — this is what keeps Uranus/Neptune reachable.
Picking = raycast on `pointerup`, suppressed if the pointer moved >5 px so orbit-drag never
selects. DOM labels projected per frame (transform writes only, no DOM rebuilding).
`prefers-reduced-motion` halts orbital motion.

### Label handling (non-obvious, don't "simplify" it)
AU-derived spacing packs the four inner planets within a few dozen pixels of each other, so raw
labels overlapped and the wrong body received the click. Three rules in `updateLabels()`:
1. **De-collision** in fixed Sun-outward order (NOT sorted by y — a stable order stops labels
   swapping slots frame-to-frame under a moving cursor).
2. Gap = the label's **measured** `offsetHeight + 3`, recomputed on resize (the mobile breakpoint
   enlarges touch padding).
3. On viewports ≤860px, colliding labels are **culled, not stacked** (stacking builds a vertical
   column that no longer points at any planet). The selected body's label always survives.
Labels also flip to the left of their body when they would run past the viewport edge.

### Body index
`#body-index` in the panel lists all 10 bodies and is the deterministic way to reach any of them —
mouse, touch and keyboard. It exists because tiny, fast-moving inner planets are not a reliable
click target. Test ids: `index-<id>` (panel) and `label-<id>` (scene).

### Textures
Procedural canvas maps (`src/site/textures.js`). Drop equirectangular JPGs into
`public/textures/` and list the ids in `textures/manifest.json` to override. Empty manifest =
zero requests, no 404s.

## Mobile
`max-width: 860px` → single column, `grid-template-rows: 54svh 1fr`, **scene on top, panel
below** (`.viewport` order 1, `.panel` order 2). Panel scrolls internally; the page never scrolls
(`body { overflow: hidden }`, `.stage { position: fixed }`) so there is no horizontal overflow.
Labels get enlarged touch padding. Canvas resize is driven by `ResizeObserver`, which covers
orientation change.

## Backend
- `GET /api/overview` → `Overview`
- `GET /api/bodies` → `Body[]`
- `GET /api/bodies/{body_id}` → `Body` (404 on unknown id)

Models `backend/models/bodies.py`, content `backend/data/bodies_data.py`, router
`backend/routers/bodies.py` (reads Mongo `bodies`, falls back to bundled data when unseeded).
`backend/seed.py` upserts. TS mirrors: `frontend/src/site/types.ts`. The scene never waits on the
network — geometry is local, API copy is merged in on arrival.

## Changes made to the user's files (deliberately minimal)
1. `js/sun.js` — removed a **duplicated `import { initSunSpacecraft, updateSunSpacecraft }` block**.
   It threw `Identifier 'initSunSpacecraft' has already been declared`, which killed the whole Sun
   module at parse time (no canvas at all). This was pre-existing.
2. `pages/{sun,moon,mars,saturn}.html` — back link `../index.html` (a file that never existed)
   → `../solar-system.html`.
3. Excluded `assets/sources/` (Blender `.blend` files + a duplicate 81 MB `moon.glb`) — build
   artifacts referenced by no runtime code.
Nothing else in the user's modules was touched.

## Known pre-existing gaps in the uploaded repo (NOT introduced here)
- 0-byte files: `css/global.css`, `css/home.css`, `css/space101.css`, `css/css/solar-system.css`,
  `js/main.js`, `js/solar-system.js`, `js/space101.js`, `js/sun-compare.js`, `js/utils/*.js`,
  `assets/data/lro.json`, `assets/data/sun/sun-features.json`,
  `assets/textures/sun/sun_surface.jpg`, `assets/textures/moon/moon-color.jpg`,
  `assets/textures/moon/moon-height.png`.
- `assets/data/sun/spacecraft-info.json` references
  `/assets/media/sun/spacecraft/{parker,soho,solar-orbiter}/*.jpg` which are absent from the repo.
- `assets/textures/mars/mars-color.jpg.jpg` has a doubled extension and is referenced by nothing.
- Total assets ≈ 372 MB; `solar-orbiter.glb` is 89 MB and `moon.glb` 81 MB, so those two modules
  are slow on a cold load.

## TR/EN
Not implemented — the user deferred it. Turkish is the only language today.

## Auth
None.
