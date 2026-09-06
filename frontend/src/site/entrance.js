/**
 * index.html backdrop — 2D canvas only. No Three.js, no GLB, no textures:
 * the entrance must stay lightweight.
 *
 * Composition: a deep star field plus the unlit limb of a nearby world in the
 * lower right, catching a thin sliver of sunlight.
 */

const canvas = document.getElementById("backdrop");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let w = 0;
let h = 0;
let stars = [];
let parallax = { x: 0, y: 0 };
let target = { x: 0, y: 0 };

function seedStars() {
  const count = Math.round((w * h) / 5200);
  stars = new Array(count).fill(0).map(() => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() < 0.9 ? Math.random() * 0.85 + 0.2 : Math.random() * 1.5 + 0.9,
    a: Math.random() * 0.55 + 0.12,
    // slow, uneven scintillation — never a synchronised blink
    tw: Math.random() * 0.6 + 0.2,
    ph: Math.random() * Math.PI * 2,
    depth: Math.random() * 0.7 + 0.3,
  }));
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStars();
}

function drawLimb() {
  // The world sits mostly off-canvas: only its curve and terminator read.
  const cx = w * 1.02 + parallax.x * 1.6;
  const cy = h * 1.16 + parallax.y * 1.6;
  const r = Math.max(w, h) * 0.62;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // body — barely lighter than the void, so it occludes stars rather than glowing
  ctx.fillStyle = "#080a10";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // grazing light along the upper-left limb
  const lit = ctx.createRadialGradient(cx - r * 0.72, cy - r * 0.78, r * 0.05, cx, cy, r);
  lit.addColorStop(0, "rgba(126, 146, 178, 0.5)");
  lit.addColorStop(0.28, "rgba(74, 90, 116, 0.16)");
  lit.addColorStop(0.55, "rgba(30, 38, 54, 0.04)");
  lit.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = lit;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // hairline atmosphere along the terminator
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 1.02, Math.PI * 1.62);
  ctx.strokeStyle = "rgba(168, 190, 220, 0.34)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

let t = 0;
function frame() {
  t += reduceMotion ? 0 : 0.008;
  parallax.x += (target.x - parallax.x) * 0.045;
  parallax.y += (target.y - parallax.y) * 0.045;

  ctx.fillStyle = "#05060a";
  ctx.fillRect(0, 0, w, h);

  for (const s of stars) {
    const a = s.a * (0.68 + 0.32 * Math.sin(t * s.tw + s.ph));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#dfe6f2";
    ctx.beginPath();
    ctx.arc(s.x + parallax.x * s.depth, s.y + parallax.y * s.depth, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawLimb();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (e) => {
  if (reduceMotion) return;
  target.x = (e.clientX / window.innerWidth - 0.5) * -16;
  target.y = (e.clientY / window.innerHeight - 0.5) * -12;
});

resize();
frame();
