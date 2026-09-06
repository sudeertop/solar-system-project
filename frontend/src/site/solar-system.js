import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BODY_GEOMETRY, OVERVIEW_FALLBACK } from "./bodies.js";
import { glowSprite, loadUserTexture, proceduralMap, ringMap, textureManifest } from "./textures.js";

/* ================================================================
   Güneş Sistemi'ni Keşfet — main interactive scene
   ================================================================ */

const canvas = document.getElementById("scene");
const labelLayer = document.getElementById("labels");
const panelBody = document.getElementById("panel-body");
const scaleNote = document.getElementById("scale-note");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- renderer ------------------------------------------- */

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);

const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 4000);
camera.position.set(0, 46, 132);

/* The whole disc out to Neptune must fit the viewport at any aspect ratio —
   otherwise the outer planets are unreachable. Recomputed on resize until the
   user takes over the camera. */
const MAX_ORBIT = Math.max(...BODY_GEOMETRY.filter((b) => !b.parent).map((b) => b.orbitRadius));
let userTookOver = false;

function frameSystem() {
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const need = MAX_ORBIT + 7; // margin for the outermost label
  const d = Math.max((need / (halfV * camera.aspect)) * 1.05, need * 1.7);
  // hold a shallow ~19° elevation so the orbital plane reads as a disc
  camera.position.copy(new THREE.Vector3(0, 0.35, 1).normalize().multiplyScalar(d));
  camera.lookAt(0, 0, 0);
}

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.42;
controls.zoomSpeed = 0.7;
controls.enablePan = false;
controls.minDistance = 16;
controls.maxDistance = 900;
controls.maxPolarAngle = Math.PI * 0.86;
controls.minPolarAngle = Math.PI * 0.08;
controls.addEventListener("start", () => {
  userTookOver = true;
});

/* ---------- lighting -------------------------------------------- */

const sunLight = new THREE.PointLight(0xfff0dc, 3600, 0, 2);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x2a3348, 0.5));

/* ---------- star field ------------------------------------------ */

function buildStars() {
  const count = 4200;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // uniform on a large sphere shell
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = 900 + Math.random() * 900;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(theta);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(theta);
    // real star colours skew blue-white to amber; keep them desaturated
    const t = Math.random();
    c.setHSL(t < 0.75 ? 0.58 : 0.09, 0.18, 0.55 + Math.random() * 0.4);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.7,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  scene.add(new THREE.Points(geo, mat));
}
buildStars();

/* ---------- bodies ---------------------------------------------- */

const SPHERE = new THREE.SphereGeometry(1, 64, 48);
const DEFAULT_LABEL_OFFSET = [10, -7];
/** @type {Map<string, {spec: object, pivot: THREE.Object3D, mesh: THREE.Mesh, label: HTMLElement, angle: number}>} */
const bodies = new Map();
const pickables = [];
/** @type {Map<string, THREE.Material>} */
const materials = new Map();

function ringMesh(spec) {
  const [innerK, outerK] = spec.rings;
  const geo = new THREE.RingGeometry(spec.radius * innerK, spec.radius * outerK, 160, 1);
  // RingGeometry ships square UVs; remap u to normalised radius so the band map reads outward
  const p = geo.attributes.position;
  const uv = geo.attributes.uv;
  const inner = spec.radius * innerK;
  const outer = spec.radius * outerK;
  for (let i = 0; i < p.count; i++) {
    const d = Math.hypot(p.getX(i), p.getY(i));
    uv.setXY(i, (d - inner) / (outer - inner), 0.5);
  }
  uv.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: ringMap(spec.color, spec.id),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: spec.id === "saturn" ? 0.92 : 0.4,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function orbitLine(radius) {
  const pts = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: 0x8fa0bd,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  return new THREE.LineLoop(geo, mat);
}

function buildBody(spec) {
  const map = proceduralMap(spec, maxAniso);
  const isStar = spec.surface === "star";
  const material = isStar
    ? new THREE.MeshBasicMaterial({ map })
    : new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0.02 });

  materials.set(spec.id, material);
  const mesh = new THREE.Mesh(SPHERE, material);
  mesh.scale.setScalar(spec.radius);
  mesh.rotation.z = spec.tilt ?? 0;
  mesh.userData.bodyId = spec.id;

  // pivot carries the orbital position; the mesh spins inside it
  const pivot = new THREE.Object3D();
  const holder = new THREE.Object3D();
  holder.position.x = spec.orbitRadius;
  holder.add(mesh);
  if (spec.rings) holder.add(ringMesh(spec));
  pivot.add(holder);

  if (isStar) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowSprite(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    sprite.scale.setScalar(spec.radius * 4);
    holder.add(sprite);
  }

  const parent = spec.parent ? bodies.get(spec.parent) : null;
  if (parent) {
    parent.holder.add(pivot); // orbit the parent's holder
  } else {
    scene.add(pivot);
    if (spec.orbitRadius > 0) scene.add(orbitLine(spec.orbitRadius));
  }

  const label = document.createElement("button");
  label.type = "button";
  label.className = `label label--${spec.mode}`;
  label.dataset.testid = `label-${spec.id}`;
  label.setAttribute("data-body", spec.id);
  label.innerHTML = `<span class="label__dot"></span><span class="label__name">${spec.name.toLocaleUpperCase("tr-TR")}</span>${
    spec.mode === "page" ? '<span class="label__mark">↗</span>' : ""
  }`;
  label.addEventListener("click", () => select(spec.id));
  labelLayer.appendChild(label);

  const entry = {
    spec,
    pivot,
    holder,
    mesh,
    label,
    offset: spec.labelOffset ?? DEFAULT_LABEL_OFFSET,
    angle: Math.random() * Math.PI * 2,
  };
  pivot.rotation.y = entry.angle;
  bodies.set(spec.id, entry);
  pickables.push(mesh);
}

BODY_GEOMETRY.forEach(buildBody);

/* selection reticle — a thin camera-facing ring, no glow */
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.035, 96),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthTest: false,
  }),
);
reticle.renderOrder = 5;
reticle.visible = false;
scene.add(reticle);

/* ---------- editorial content ----------------------------------- */

/** @type {Map<string, import('./types').Body>} */
const content = new Map();
let overview = OVERVIEW_FALLBACK;
let selectedId = null;

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
  );

function sectionsHtml(sections) {
  if (!sections || !sections.length) return "";
  return `<div class="panel__sections">${sections
    .map(
      (s) => `<section class="panel__section">
        <h3 class="panel__h3">${esc(s.heading)}</h3>
        <p class="panel__p">${esc(s.body)}</p>
      </section>`,
    )
    .join("")}</div>`;
}

function renderOverview() {
  panelBody.innerHTML = `
    <p class="kicker">${esc(overview.kicker)}</p>
    <h2 class="panel__title" data-testid="panel-title">${esc(overview.title)}</h2>
    <p class="panel__lead">${esc(overview.lead)}</p>
    ${sectionsHtml(overview.sections)}
    <p class="panel__hint" data-testid="panel-hint">${esc(overview.hint)}</p>`;
  animatePanel();
}

function renderBody(id) {
  const spec = bodies.get(id).spec;
  const data = content.get(id);
  const stats = data?.stats ?? [];
  panelBody.innerHTML = `
    <p class="kicker">${esc(data?.kicker ?? spec.kicker)}</p>
    <h2 class="panel__title" data-testid="panel-title">${esc(spec.name)}</h2>
    <p class="panel__lead">${esc(data?.lead ?? spec.lead)}</p>
    ${
      stats.length
        ? `<dl class="stats" data-testid="panel-stats">${stats
            .map(
              (s) =>
                `<div class="stats__row"><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`,
            )
            .join("")}</dl>`
        : '<p class="panel__hint">Ayrıntılı veriler yüklenemedi.</p>'
    }
    ${sectionsHtml(data?.sections)}`;
  animatePanel();
}

function animatePanel() {
  if (reduceMotion) return;
  panelBody.animate(
    [
      { opacity: 0, transform: "translateY(7px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  panelBody.parentElement.scrollTop = 0;
}

/* ---------- selection ------------------------------------------- */

function select(id) {
  const entry = bodies.get(id);
  if (!entry) return;

  // Category A — Sun / Moon / Mars / Saturn own dedicated exploration pages.
  if (entry.spec.mode === "page" && entry.spec.href) {
    window.location.href = entry.spec.href;
    return;
  }

  // Category B — panel only. The scene keeps its viewing context.
  selectedId = id;
  bodies.forEach((b, key) => b.label.classList.toggle("is-selected", key === id));
  reticle.visible = true;
  syncIndex();
  renderBody(id);
}

function clearSelection() {
  selectedId = null;
  bodies.forEach((b) => b.label.classList.remove("is-selected"));
  reticle.visible = false;
  syncIndex();
  renderOverview();
}

document.getElementById("panel-reset").addEventListener("click", clearSelection);

/* ---------- body index (panel) ----------------------------------- */

const indexEl = document.getElementById("body-index");

BODY_GEOMETRY.forEach((spec) => {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "index__item";
  item.dataset.testid = `index-${spec.id}`;
  item.dataset.body = spec.id;
  item.dataset.active = "false";
  item.innerHTML =
    `<span class="index__dot"></span>${spec.name.toLocaleUpperCase("tr-TR")}` +
    (spec.mode === "page" ? '<span class="index__mark">↗</span>' : "");
  item.addEventListener("click", () => select(spec.id));
  indexEl.appendChild(item);
});

function syncIndex() {
  indexEl.querySelectorAll(".index__item").forEach((el) => {
    el.dataset.active = String(el.dataset.body === selectedId);
  });
}

/* ---------- pointer picking ------------------------------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
let hoveredId = null;

function pickAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables, false)[0];
  return hit ? hit.object.userData.bodyId : null;
}

canvas.addEventListener("pointerdown", (e) => {
  downAt = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 5) return; // it was an orbit drag, not a click
  const id = pickAt(e.clientX, e.clientY);
  if (id) select(id);
});

canvas.addEventListener("pointermove", (e) => {
  const id = pickAt(e.clientX, e.clientY);
  if (id === hoveredId) return;
  hoveredId = id;
  canvas.style.cursor = id ? "pointer" : "grab";
  bodies.forEach((b, key) => b.label.classList.toggle("is-hover", key === hoveredId));
});

/* ---------- loop ------------------------------------------------- */

/* Time is compressed, not linear: angular rate scales with period^-0.7.
   Real periods (^-1) would leave Neptune frozen for the whole visit; equal
   speeds would be a lie. At 0.7 the contrast stays large and honest —
   Mercury runs ~2.7x faster than Earth, Neptune ~36x slower — and every
   planet still visibly moves. */
const BASE_RATE = 0.34;
const RATE_EXPONENT = 0.7;
const LABEL_MIN_X = 96;
/* Measured from the rendered label, not guessed: the gap must exceed the label's
   own height or the boxes still overlap and the topmost one steals the click.
   Recomputed on resize because the mobile breakpoint enlarges touch padding. */
let labelMinY = 20;
/* Narrow viewports cannot absorb a de-collision stack: nudging every inner
   label down builds a vertical column that no longer points at any planet,
   which is worse than not labelling them. There we CULL instead of stack. */
let compact = false;

function measureLabelHeight() {
  const first = labelLayer.querySelector(".label");
  const h = first ? first.offsetHeight : 0;
  labelMinY = Math.max(h + 3, 16);
  compact = window.innerWidth <= 860;
}
/** Reused each frame for label layout — allocated once, never per-frame. */
const placed = [];
const projected = new THREE.Vector3();
const clock = new THREE.Clock();

function updateLabels() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  placed.length = 0;

  bodies.forEach((entry) => {
    entry.mesh.getWorldPosition(projected);
    const dist = projected.distanceTo(camera.position);
    projected.project(camera);
    const visible = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
    const el = entry.label;
    if (!visible) {
      if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
      return;
    }
    if (el.style.visibility === "hidden") el.style.visibility = "";
    placed.push({
      el,
      id: entry.spec.id,
      culled: false,
      x: (projected.x * 0.5 + 0.5) * w + entry.offset[0],
      y: (-projected.y * 0.5 + 0.5) * h + entry.offset[1],
      dist,
    });
  });

  /* De-collide vertically. With AU-derived spacing the four inner planets project
     within a few dozen pixels of each other, so without this their labels overlap
     and the wrong one receives the click. Nudge, never hide.
     Order is the fixed Sun-outward body order (not sorted by y): a stable order
     means a label keeps its slot frame to frame instead of swapping with its
     neighbour, which would make it a moving click target. */
  for (let i = 1; i < placed.length; i++) {
    for (let j = 0; j < i; j++) {
      if (placed[j].culled) continue;
      if (
        Math.abs(placed[i].x - placed[j].x) < LABEL_MIN_X &&
        Math.abs(placed[i].y - placed[j].y) < labelMinY
      ) {
        if (compact && placed[i].id !== selectedId) {
          placed[i].culled = true; // keep the scene honest rather than tidy
          break;
        }
        placed[i].y = placed[j].y + labelMinY;
      }
    }
  }

  for (const p of placed) {
    if (p.culled) {
      if (p.el.style.visibility !== "hidden") p.el.style.visibility = "hidden";
      continue;
    }
    // Flip to the left of the body when the label would run past the viewport edge.
    const lw = p.el.offsetWidth;
    const x = p.x + lw > w - 6 ? p.x - lw - 14 : p.x;
    p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
    p.el.style.opacity = p.dist > 700 ? "0.3" : "1";
  }
}

function tick() {
  const dt = clock.getDelta();
  if (!reduceMotion) {
    bodies.forEach((entry) => {
      const { spec, pivot, mesh } = entry;
      if (spec.periodDays) {
        pivot.rotation.y += (dt * BASE_RATE) / Math.pow(spec.periodDays / 365.25, RATE_EXPONENT);
      }
      mesh.rotation.y += dt * (spec.surface === "bands" ? 0.22 : 0.09);
    });
  }

  if (selectedId) {
    const entry = bodies.get(selectedId);
    entry.mesh.getWorldPosition(reticle.position);
    reticle.scale.setScalar(entry.spec.radius * 1.75);
    reticle.quaternion.copy(camera.quaternion);
  }

  controls.update();
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  measureLabelHeight();
  if (!userTookOver) frameSystem();
}

new ResizeObserver(resize).observe(canvas);
resize();
canvas.style.cursor = "grab";
renderOverview();
tick();

/* ---------- content hydration ------------------------------------ */
/* The scene never waits on the network; panel copy is merged in when it lands. */

async function hydrate() {
  const [ov, list] = await Promise.all([
    fetch("/api/overview").then((r) => (r.ok ? r.json() : null)),
    fetch("/api/bodies").then((r) => (r.ok ? r.json() : null)),
  ]);
  if (Array.isArray(list)) list.forEach((b) => content.set(b.id, b));
  if (ov) overview = ov;
  if (selectedId) renderBody(selectedId);
  else renderOverview();
  if (scaleNote) scaleNote.hidden = false;
}

hydrate().catch(() => {
  /* offline / static preview — bundled fallback copy stays on screen */
});

/* User-supplied equirectangular maps replace the procedural ones when present. */
textureManifest().then((ids) => {
  ids.forEach((id) => {
    const material = materials.get(id);
    if (!material) return;
    loadUserTexture(id, maxAniso, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });
  });
});
