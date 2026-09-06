/**
 * Scene geometry for the Solar System view.
 *
 * These are the values the 3D scene needs synchronously, before any network
 * call — so the visualisation always renders. Editorial panel content lives in
 * the backend (/api/bodies) and is merged in when it arrives.
 *
 * ── ORBITAL DISTANCE MAPPING ──────────────────────────────────────────────
 * Orbit radii are DERIVED from real semi-major axes (AU), not hand-placed.
 * A literal linear mapping is unusable: Neptune sits 77x further out than
 * Mercury, so the four inner planets would collapse into the Sun's disc.
 *
 * Strategy: a single power-law compression, applied uniformly.
 *
 *     r(scene) = R0 * (a_AU ^ 0.58)
 *
 * A power law (not a logarithm, not piecewise segments) is used deliberately:
 *   - It is monotonic, so planet ORDER is always correct.
 *   - One exponent for every planet means no arbitrary per-planet fudging;
 *     the whole system is one honest, reproducible transform.
 *   - It preserves the qualitative truth that outer gaps are far larger.
 *     Measured on this mapping, the Uranus→Neptune gap is 9.6x the
 *     Venus→Earth gap (true linear: 39.3x). A log10 mapping would have
 *     crushed that to 1.4x — i.e. almost equal gaps, exactly what we must
 *     avoid. So: dramatically compressed, but still dramatically uneven.
 *
 * This is a COMPRESSED visualisation and the UI says so. It is not to scale.
 * Body radii are compressed separately (and far more aggressively) — a
 * true-to-scale Sun beside a true-to-scale Mercury would be invisible.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Real semi-major axes, AU (IAU / NASA planetary fact sheet values). */
export const SEMI_MAJOR_AXIS_AU = {
  mercury: 0.387,
  venus: 0.723,
  earth: 1.0,
  mars: 1.524,
  jupiter: 5.203,
  saturn: 9.537,
  uranus: 19.191,
  neptune: 30.07,
};

const DISTANCE_EXPONENT = 0.58;
const DISTANCE_SCALE = 15.0;

/** AU -> scene units. Exported so the UI can explain the mapping honestly. */
export function orbitRadiusFor(au) {
  return DISTANCE_SCALE * Math.pow(au, DISTANCE_EXPONENT);
}

const R = (id) => Number(orbitRadiusFor(SEMI_MAJOR_AXIS_AU[id]).toFixed(2));

export const BODY_GEOMETRY = [
  {
    id: "sun",
    name: "Güneş",
    kicker: "Yıldız",
    mode: "page",
    href: "/pages/sun.html",
    lead: "Sistemin toplam kütlesinin yaklaşık %99,86'sını taşıyan yıldız.",
    color: "#f0a24a",
    radius: 3.6,
    orbitRadius: 0,
    periodDays: null,
    surface: "star",
    tilt: 0.13,
  },
  {
    id: "mercury",
    name: "Merkür",
    kicker: "I. Gezegen",
    mode: "panel",
    href: null,
    lead: "Güneş'e en yakın ve en küçük gezegen.",
    color: "#8f8a84",
    radius: 0.62,
    orbitRadius: R("mercury"),
    periodDays: 88,
    surface: "rock",
    tilt: 0.0006,
  },
  {
    id: "venus",
    name: "Venüs",
    kicker: "II. Gezegen",
    mode: "panel",
    href: null,
    lead: "Yoğun karbondioksit atmosferiyle sistemin en sıcak gezegeni.",
    color: "#d8b68a",
    radius: 1.3,
    orbitRadius: R("venus"),
    periodDays: 224.7,
    surface: "cloud",
    tilt: 3.09,
  },
  {
    id: "earth",
    name: "Dünya",
    kicker: "III. Gezegen",
    mode: "panel",
    href: null,
    lead: "Yüzeyinde kararlı sıvı su bulunan gezegen.",
    color: "#4a7fa8",
    radius: 1.35,
    orbitRadius: R("earth"),
    periodDays: 365.25,
    surface: "terra",
    tilt: 0.41,
  },
  {
    id: "moon",
    name: "Ay",
    kicker: "Dünya'nın uydusu",
    mode: "page",
    href: "/pages/moon.html",
    lead: "Dünya'nın tek doğal uydusu.",
    color: "#9a978f",
    radius: 0.38,
    orbitRadius: 2.9,
    periodDays: 27.3,
    surface: "rock",
    tilt: 0.11,
    parent: "earth",
    // Earth and its satellite project a few pixels apart; push the Moon's label
    // clear of Earth's so neither becomes unclickable.
    labelOffset: [12, 16],
  },
  {
    id: "mars",
    name: "Mars",
    kicker: "IV. Gezegen",
    mode: "page",
    href: "/pages/mars.html",
    lead: "Demir oksitçe zengin yüzeyiyle kızıl görünen gezegen.",
    color: "#b45a3c",
    radius: 0.75,
    orbitRadius: R("mars"),
    periodDays: 687,
    surface: "rock",
    tilt: 0.44,
  },
  {
    id: "jupiter",
    name: "Jüpiter",
    kicker: "V. Gezegen",
    mode: "panel",
    href: null,
    lead: "Sistemin en büyük gezegeni.",
    color: "#c9a37a",
    radius: 3.4,
    orbitRadius: R("jupiter"),
    periodDays: 4333,
    surface: "bands",
    tilt: 0.05,
  },
  {
    id: "saturn",
    name: "Satürn",
    kicker: "VI. Gezegen",
    mode: "page",
    href: "/pages/saturn.html",
    lead: "Geniş halka sistemiyle tanınan gaz devi.",
    color: "#d8c8a0",
    radius: 3.0,
    orbitRadius: R("saturn"),
    periodDays: 10759,
    surface: "bands",
    tilt: 0.47,
    rings: [1.28, 2.05],
  },
  {
    id: "uranus",
    name: "Uranüs",
    kicker: "VII. Gezegen",
    mode: "panel",
    href: null,
    lead: "Neredeyse yan yatmış eksende dönen buz devi.",
    color: "#8fb8bd",
    radius: 1.9,
    orbitRadius: R("uranus"),
    periodDays: 30687,
    surface: "cloud",
    tilt: 1.71,
    rings: [1.5, 1.72],
  },
  {
    id: "neptune",
    name: "Neptün",
    kicker: "VIII. Gezegen",
    mode: "panel",
    href: null,
    lead: "Güneş'e en uzak gezegen; en hızlı rüzgârlara sahiptir.",
    color: "#4a6fa8",
    radius: 1.85,
    orbitRadius: R("neptune"),
    periodDays: 60190,
    surface: "cloud",
    tilt: 0.49,
  },
];

export const OVERVIEW_FALLBACK = {
  kicker: "GENEL BAKIŞ",
  title: "Güneş Sistemi",
  lead: "Güneş'in kütleçekimine bağlı sekiz gezegen, uydular ve sayısız küçük cisim.",
  sections: [],
  hint: "Bir gök cismi seçin.",
};
