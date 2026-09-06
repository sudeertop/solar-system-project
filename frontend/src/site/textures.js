import * as THREE from "three";

/**
 * Procedural surface maps.
 *
 * Real image textures are preferred: if /textures/<id>.jpg exists it is loaded
 * and swapped in. Until then these canvas maps give each body a distinct,
 * art-directed surface instead of a flat plastic sphere.
 */

const loader = new THREE.TextureLoader();

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shade(hex, amount) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return `#${c.getHexString()}`;
}

/** @returns {HTMLCanvasElement} */
function makeCanvas(w, h) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return cv;
}

function paintBands(ctx, w, h, color, rand, bandCount) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  let y = 0;
  while (y < h) {
    const band = (h / bandCount) * (0.4 + rand() * 1.6);
    ctx.fillStyle = shade(color, (rand() - 0.5) * 0.14);
    ctx.globalAlpha = 0.85;
    // wobble the band edge so it does not read as a printed stripe
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.03 + rand()) * 2.2);
    }
    ctx.lineTo(w, y + band);
    ctx.lineTo(0, y + band);
    ctx.closePath();
    ctx.fill();
    y += band;
  }
  ctx.globalAlpha = 1;
}

function paintSpeckle(ctx, w, h, color, rand, count, spread) {
  for (let i = 0; i < count; i++) {
    const r = 1 + rand() * spread;
    ctx.fillStyle = shade(color, (rand() - 0.5) * 0.22);
    ctx.globalAlpha = 0.25 + rand() * 0.4;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintContinents(ctx, w, h, ocean, land, rand) {
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const cx = rand() * w;
    const cy = h * 0.15 + rand() * h * 0.7;
    const rx = 18 + rand() * 90;
    const ry = 12 + rand() * 44;
    ctx.fillStyle = shade(land, (rand() - 0.5) * 0.16);
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // polar caps
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#dfe6ec";
  ctx.fillRect(0, 0, w, h * 0.05);
  ctx.fillRect(0, h * 0.955, w, h * 0.045);
  ctx.globalAlpha = 1;
}

function paintStar(ctx, w, h, color, rand) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = shade(color, (rand() - 0.45) * 0.3);
    ctx.globalAlpha = 0.18 + rand() * 0.3;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, 2 + rand() * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Build a procedural colour map for one body. */
export function proceduralMap(spec, maxAnisotropy) {
  const w = 1024;
  const h = 512;
  const cv = makeCanvas(w, h);
  const ctx = cv.getContext("2d");
  const rand = mulberry32(seedFrom(spec.id));

  switch (spec.surface) {
    case "star":
      paintStar(ctx, w, h, spec.color, rand);
      break;
    case "bands":
      paintBands(ctx, w, h, spec.color, rand, 26);
      paintSpeckle(ctx, w, h, spec.color, rand, 320, 9);
      break;
    case "cloud":
      paintBands(ctx, w, h, spec.color, rand, 9);
      paintSpeckle(ctx, w, h, spec.color, rand, 500, 14);
      break;
    case "terra":
      paintContinents(ctx, w, h, spec.color, "#4d6b45", rand);
      paintSpeckle(ctx, w, h, "#c8d2dc", rand, 260, 7);
      break;
    default:
      ctx.fillStyle = spec.color;
      ctx.fillRect(0, 0, w, h);
      paintSpeckle(ctx, w, h, spec.color, rand, 1400, 6);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/**
 * Swap in a real texture when the user drops one into /public/textures/ and
 * lists it in textures/manifest.json. Manifest-driven so the scene never fires
 * speculative 404s for textures that do not exist yet.
 */
export function loadUserTexture(id, maxAnisotropy, onLoaded) {
  loader.load(
    `/textures/${id}.jpg`,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;
      tex.wrapS = THREE.RepeatWrapping;
      onLoaded(tex);
    },
    undefined,
    () => {
      console.warn(`[textures] /textures/${id}.jpg listelendi ama yüklenemedi.`);
    },
  );
}

/** Ids listed in /textures/manifest.json, or an empty list when absent. */
export async function textureManifest() {
  try {
    const res = await fetch("/textures/manifest.json");
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.textures) ? json.textures : [];
  } catch {
    return [];
  }
}

/** Radial falloff sprite used for the Sun's corona. One shared texture. */
export function glowSprite() {
  const cv = makeCanvas(256, 256);
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,208,150,0.55)");
  g.addColorStop(0.28, "rgba(255,170,90,0.22)");
  g.addColorStop(0.6, "rgba(255,140,60,0.06)");
  g.addColorStop(1, "rgba(255,130,50,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Banded, semi-transparent ring map (Saturn / Uranus). */
export function ringMap(color, id) {
  const cv = makeCanvas(1024, 8);
  const ctx = cv.getContext("2d");
  const rand = mulberry32(seedFrom(id + "ring"));
  ctx.clearRect(0, 0, 1024, 8);
  let x = 0;
  while (x < 1024) {
    const wBand = 4 + rand() * 46;
    const alpha = rand() < 0.16 ? 0 : 0.15 + rand() * 0.6;
    ctx.fillStyle = shade(color, (rand() - 0.5) * 0.2);
    ctx.globalAlpha = alpha;
    ctx.fillRect(x, 0, wBand, 8);
    x += wBand;
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
