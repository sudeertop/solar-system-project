# Güneş Sistemi'ni Keşfet — SPEC

Turkish interactive astronomy education site. **Plain multi-page HTML/CSS/JS + Three.js**
(no React router, no framework migration). FastAPI serves the editorial content.

## Pages (each a Vite HTML entry in `frontend/`)

| URL | File | Role |
|---|---|---|
| `/` | `frontend/index.html` | Entrance. Title "Güneş Sistemi'ni Keşfet", `BAŞLA` → `/solar-system.html`, quiet `UZAY 101` → `/space101.html`. 2D canvas backdrop only (`src/site/entrance.js`) — no Three.js, stays lightweight. |
| `/solar-system.html` | `frontend/solar-system.html` | Main 3D experience (`src/site/solar-system.js`). |
| `/sun.html` `/moon.html` `/mars.html` `/saturn.html` `/space101.html` | placeholders | **Temporary.** The user owns the real modules (private repo, not available at build time). Each carries `← GÜNEŞ SİSTEMİ'NE DÖN` → `/solar-system.html`. Dropping the user's real files into `frontend/` replaces them; all inbound links keep working. |

## Two click behaviours (core requirement)

- **Category A — navigate away:** Güneş, Ay, Mars, Satürn (`mode: "page"`) → `window.location.href = href`.
  No zoom, no modal, no duplicated detail experience inside the scene.
- **Category B — panel only:** Merkür, Venüs, Dünya, Jüpiter, Uranüs, Neptün (`mode: "panel"`).
  Only `#panel-body` re-renders. No camera flight, scene stays in the same viewing context.
  Selection feedback = camera-facing hairline reticle + label emphasis.
- `Genel` button (`#panel-reset`) restores the Solar System overview panel.

## Scene

`src/site/solar-system.js` — WebGLRenderer (SRGBColorSpace, pixelRatio capped at 2, ACES tone
mapping), OrbitControls with damping, `minDistance 16` / `maxDistance 260`, pan disabled.
4,200-point star field. Thin orbit LineLoops. Moon orbits Earth's holder. Saturn + Uranus rings
via RingGeometry with remapped radial UVs. Picking = raycast on `pointerup`, suppressed if the
pointer moved >5px (so orbit-drag never selects). DOM labels projected per frame (transform
writes only). `prefers-reduced-motion` halts orbital motion.

Orbital rate is compressed as `period^-0.5` so inner-faster-than-outer ordering holds while
Neptune still visibly moves. Radii/distances are compressed — the UI states this explicitly.

### Textures
Procedural canvas maps (`src/site/textures.js`) by default. The user drops equirectangular JPGs
into `frontend/public/textures/` and lists the ids in `textures/manifest.json`; listed ids are
loaded and swapped in. Empty manifest = zero network requests, no 404s.

## Backend

- `GET /api/overview` → `Overview`
- `GET /api/bodies` → `Body[]`
- `GET /api/bodies/{body_id}` → `Body` (404 on unknown id)

Models: `backend/models/bodies.py`. Content: `backend/data/bodies_data.py` (Turkish, standard
published figures). `backend/routers/bodies.py` reads Mongo `bodies` and falls back to the
bundled data when the collection is empty, so the API works unseeded. `backend/seed.py` upserts.
TS mirrors: `frontend/src/site/types.ts`.

The scene never waits on the network — geometry lives in `src/site/bodies.js` with fallback lead
copy, and API content is merged in on arrival.

## Auth
None. No accounts, no login.
