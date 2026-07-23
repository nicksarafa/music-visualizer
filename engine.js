"use strict";

/* ================================================================
   pigment — engine
   All audio analysis and paint physics live here. Visual identity
   lives in skins/*.js — small files registered via
   PIGMENT.registerSkin(). See SCORING.md before changing visuals.
   ================================================================ */

/* ---------------- skin system ---------------- */

const SKINS = {};
let SKIN = null;   // active skin object

// Material and movement are deliberately independent. A skin decides how
// pigment behaves; a composition decides how music travels from the center.
const COMPOSITIONS = [
  {
    id: "liquid-bloom", label: "liquid bloom", gesture: "liquid",
    note: "pressure-soft droplets push, gather, and curl outward from the center",
  },
  {
    id: "sacred-rose", label: "sacred rose", gesture: "sacred",
    note: "harmonic star-rosettes construct themselves in luminous symmetry",
  },
  {
    id: "living-sand", label: "living sand", gesture: "sand",
    note: "colliding grains erupt from the center, arc, and settle into time",
  },
  {
    id: "vitruvian-grove", label: "vitruvian grove", gesture: "wood",
    note: "space-seeking branches grow without gravity in every direction",
  },
  {
    id: "radiant-heart", label: "radiant heart", gesture: "ray",
    note: "clear rays open from a small pulse into the edges",
  },
  {
    id: "golden-garden", label: "golden garden", gesture: "petal",
    note: "a phyllotaxis bloom grows note by note around the center",
  },
  {
    id: "orphic-rose", label: "orphic rose", gesture: "arc",
    note: "harmonic petals fold color and rhythm into a turning rose",
  },
  {
    id: "velvet-fan", label: "velvet fan", gesture: "fan",
    note: "mirrored gestures open with the drama of a stage curtain",
  },
  {
    id: "jazz-ribbon", label: "jazz ribbon", gesture: "ribbon",
    note: "a loose lissajous line phrases the song like handwriting",
  },
  {
    id: "color-tide", label: "color tide", gesture: "ripple",
    note: "concentric waves carry quiet color across the whole field",
  },
  {
    id: "cathedral", label: "cathedral", gesture: "branch",
    note: "symmetrical branches rise from one luminous central point",
  },
  {
    id: "constellation", label: "constellation", gesture: "constellation",
    note: "seeded paths find distant points and leave a musical sky map",
  },
  {
    id: "afterimage", label: "afterimage", gesture: "wave",
    note: "opposing waves remember each phrase in slow counterpoint",
  },
  {
    id: "slow-orbit", label: "slow orbit", gesture: "spiral",
    note: "the song assembles itself outward as one patient galaxy",
  },
];
const COMPOSITION_BY_ID = Object.fromEntries(COMPOSITIONS.map(c => [c.id, c]));
let COMPOSITION = COMPOSITIONS[0];
const compositionState = {
  event: 0, seed: 0x51f15e, lastAt: 0, lastRoot: -1,
  previousEnergy: 0, energyEma: 0, lastScore: null,
};

// engine defaults; skins override any subset via skin.params
const DEFAULT_PARAMS = {
  blend: "multiply",        // paint canvas mix-blend-mode
  paperHex: "#f7f4ec",      // export background
  layerAlphaBase: 0.023,    // per-glaze opacity floor
  layerAlphaVar: 0.017,     // extra opacity for early glazes
  layerCount: [16, 22],     // [base, extra*bleed]
  deformInit: 0.12,         // wash silhouette roughness (× r)
  deformDepth: 4,           // silhouette recursion (lower = smoother shapes)
  deformLayer: 0.05,        // per-glaze edge feather (× r)
  baseVerts: 14,            // silhouette vertex count
  stretch: [1.25, 0.5],     // [min, extra] elongation along lean
  granulate: true,          // pigment specks in the paper tooth
  edgeAlpha: 0.07,          // darkened rim opacity (0 = off)
  glossAlpha: 0.16,         // wet sheen highlight (0 = matte)
  dripAlpha: 0.038,         // drip trail opacity
  dripWidthMul: 1,          // drip thickness multiplier
  dripBead: true,           // swollen droplet at the end of a run
  threadAlpha: 0.30,        // connection line opacity
  threadNodes: true,        // node beads at thread ends
  sizeMul: 1,               // overall wash scale
  leanMode: "flow",         // "flow" | "vertical" (curtains)
  gravity: 1,               // drip direction/speed; negative = paint rises
  ringed: false,            // stroke floating rings instead of filled washes
  strokeMode: "wash",       // "wash" | "airbrush" | "impasto" | "stipple" | "nacre"
  stippleDensity: 1,        // dot count multiplier for stippled media
  splat: 0,                 // 0..1: tiny droplets flung past the bloom's edge
  capillary: 0,             // 0..1: branching pigment veins growing through wet marks
  interferenceAlpha: 0,    // thin-film color bands inside nacre-like strokes
  leafAlpha: 0,             // metallic mineral fragments embedded in a stroke
  causticAlpha: 0,          // moving spectral highlight on the temporary wet layer
  movementTraceAlpha: 1,    // material response to liquid, sand, and wood solver marks
  grain: { base: 235, spread: 20, warm: true, alpha: 10, density: 0.5, light: false },
};

function P(key) { return (SKIN && SKIN.params && key in SKIN.params) ? SKIN.params[key] : DEFAULT_PARAMS[key]; }

function registerSkin(skin) {
  SKINS[skin.name] = skin;
  const select = document.getElementById("skinSelect");
  if (select && !select.querySelector(`option[value="${skin.name}"]`)) {
    const option = document.createElement("option");
    option.value = skin.name;
    option.textContent = skin.name;
    select.appendChild(option);
  }
}

let skinFading = false;
function setSkin(name, { keepPaint = false } = {}) {
  const skin = SKINS[name];
  if (!skin || (SKIN && SKIN.name === name && !keepPaint)) return;
  const apply = () => {
    SKIN = skin;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(skin.vars || {})) root.style.setProperty(k, v);
    paintC.style.mixBlendMode = P("blend");
    makeGrain();
  };
  // a skin without a dropdown option (e.g. the conductor's live material)
  // leaves the select showing its base paint instead of going blank
  const select = document.getElementById("skinSelect");
  if (select && select.querySelector(`option[value="${CSS.escape(name)}"]`)) select.value = name;
  try { localStorage.setItem("pigment-skin", name); } catch (e) {}
  if (keepPaint || !SKIN) { apply(); return; }
  // the old painting dissolves rather than vanishing
  if (skinFading) { apply(); clearPainting(); paintC.style.opacity = "1"; return; }
  skinFading = true;
  paintC.style.transition = "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)";
  paintC.style.opacity = "0";
  setTimeout(() => {
    apply();
    clearPainting();
    paintC.style.opacity = "1";
    skinFading = false;
  }, 720);
}

function resetCompositionState() {
  compositionState.event = 0;
  compositionState.lastAt = 0;
  compositionState.lastRoot = -1;
  compositionState.previousEnergy = 0;
  compositionState.energyEma = 0;
  compositionState.lastScore = null;
  flow.a = 0;
  liquidParticles.length = 0;
  sandParticles.length = 0;
  woodTips.length = 0;
  woodNodes.length = 0;
  sandSurface.length = 0;
}

function setComposition(id, { keepPaint = false } = {}) {
  const next = COMPOSITION_BY_ID[id];
  if (!next || (COMPOSITION.id === id && !keepPaint)) return;
  COMPOSITION = next;
  resetCompositionState();
  const select = document.getElementById("compositionSelect");
  const note = document.getElementById("compositionNote");
  if (select) select.value = id;
  if (note) note.textContent = next.note;
  try { localStorage.setItem("pigment-composition", id); } catch (e) {}
  if (!keepPaint) clearPainting();
}

window.PIGMENT = {
  registerSkin, setSkin, setComposition, SKINS, COMPOSITIONS,
  helpers: { pcHue: (...a) => pcHue(...a), gauss: (...a) => gauss(...a) },
};

/* ---------------- canvases ---------------- */

const DPR = Math.min(window.devicePixelRatio || 1, 2);

const paintC = document.getElementById("paint");
const wetC   = document.getElementById("wet");
const grainC = document.getElementById("grain");
const pctx = paintC.getContext("2d");
const wctx = wetC.getContext("2d");

let W = 0, H = 0;

function sizeCanvas(c) {
  c.width  = Math.round(innerWidth  * DPR);
  c.height = Math.round(innerHeight * DPR);
}

function makeGrain() {
  sizeCanvas(grainC);
  const g = grainC.getContext("2d");
  const spec = P("grain");
  const img = g.createImageData(grainC.width, grainC.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = spec.base + Math.random() * spec.spread;
    d[i] = v; d[i+1] = v - (spec.warm ? 2 : 0); d[i+2] = v - (spec.warm ? 6 : 0);
    d[i+3] = Math.random() < spec.density ? spec.alpha : 0;
  }
  g.putImageData(img, 0, 0);
}

function clearPainting() {
  pctx.clearRect(0, 0, W, H);
  blooms.length = 0; drips.length = 0; glosses.length = 0;
  threads.length = 0; gestures.length = 0; originPulses.length = 0;
  liquidParticles.length = 0; sandParticles.length = 0;
  woodTips.length = 0; woodNodes.length = 0; sandSurface.length = 0;
  capillaryVeins.length = 0;
  recentPoints.length = 0;
  resetCompositionState();
}

function resize() {
  let keep = null;
  if (paintC.width) {
    keep = document.createElement("canvas");
    keep.width = paintC.width; keep.height = paintC.height;
    keep.getContext("2d").drawImage(paintC, 0, 0);
  }
  sizeCanvas(paintC); sizeCanvas(wetC);
  W = paintC.width; H = paintC.height;
  if (keep) pctx.drawImage(keep, 0, 0);
  makeGrain();
}
window.addEventListener("resize", resize);

/* ---------------- controls ---------------- */

const ctl = {
  sens: 0.55, size: 0.5, bleed: 0.5, drip: 0.55, thread: 0.4, fade: 0, hue: 0,
};
const fmt = {
  sens:  v => v < 0.33 ? "calm" : v < 0.66 ? "easy" : "eager",
  size:  v => v < 0.33 ? "small" : v < 0.66 ? "medium" : "bold",
  bleed: v => v < 0.33 ? "tight" : v < 0.66 ? "soft" : "wide",
  drip:  v => v < 0.15 ? "none" : v < 0.5 ? "slow" : v < 0.8 ? "steady" : "runny",
  thread: v => v < 0.05 ? "none" : v < 0.4 ? "few" : v < 0.75 ? "some" : "many",
  fade:  v => v < 0.05 ? "never" : v < 0.5 ? "slow" : "quick",
  hue:   v => v === 0 ? "true" : "+" + Math.round(v) + "°",
};
function bindSlider(id, key, scale = 0.01) {
  const el = document.getElementById("c-" + id);
  const out = document.getElementById("v-" + id);
  const update = () => {
    ctl[key] = el.value * scale;
    out.textContent = fmt[key](ctl[key]);
  };
  el.addEventListener("input", update);
  update();
}
bindSlider("sens", "sens");
bindSlider("size", "size");
bindSlider("bleed", "bleed");
bindSlider("drip", "drip");
bindSlider("thread", "thread");
bindSlider("fade", "fade");
bindSlider("hue", "hue", 1);

/* ---------------- color ---------------- */

const NOTE_NAMES = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
// Circle-of-fifths hue wheel: harmonically close keys get adjacent hues.
// This mapping is the product's core promise — change it only deliberately.
const HUE_BY_FIFTH = [25, 50, 65, 80, 95, 130, 150, 165, 195, 240, 280, 310];
function pcHue(pc) {
  return (HUE_BY_FIFTH[(pc * 7) % 12] + ctl.hue) % 360;
}

// default watercolor pigment; skins may provide their own color()/edge()
function defaultColor(pc, alpha, jitterSeed, quality = 1, hueOff = 0) {
  const hue = (pcHue(pc) + hueOff + 360) % 360;
  const dh = Math.min(Math.abs(hue - 100), 360 - Math.abs(hue - 100));
  const sunlit = Math.exp(-(dh * dh) / 3200);
  const l = 0.60 + sunlit * 0.16
          + Math.sin(jitterSeed * 12.9898) * 0.05 - (1 - quality) * 0.05;
  const c = (0.135 + sunlit * 0.03 + Math.sin(jitterSeed * 78.233) * 0.02)
          * (0.72 + quality * 0.28);
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
}
function defaultEdge(pc, alpha) {
  return `oklch(0.45 0.16 ${pcHue(pc).toFixed(1)} / ${alpha.toFixed(3)})`;
}

function pigmentColor(pc, alpha, seed, quality = 1, hueOff = 0) {
  return (SKIN && SKIN.color ? SKIN.color : defaultColor)(pc, alpha, seed, quality, hueOff);
}
function pigmentEdge(pc, alpha) {
  return (SKIN && SKIN.edge ? SKIN.edge : defaultEdge)(pc, alpha);
}
// punctuation marks (drip beads, thread nodes); skins may accent these
function pigmentAccent(pc, alpha, seed) {
  return (SKIN && SKIN.accent ? SKIN.accent : pigmentColor)(pc, alpha, seed);
}
// Thin-film or mineral interference colors. Most skins simply reuse their
// accent; rare materials can provide spectral(pc, alpha, seed, phase).
function pigmentSpectral(pc, alpha, seed, phase = 0) {
  return (SKIN && SKIN.spectral ? SKIN.spectral : pigmentAccent)(pc, alpha, seed, phase);
}

/* ---------------- geometry ---------------- */

function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function basePolygon(r) {
  const n = P("baseVerts"), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.88 + Math.random() * 0.24);
    pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, v: 0.3 + Math.random() * 0.7 });
  }
  return pts;
}

function deform(pts, mag, depth) {
  if (depth <= 0) return pts;
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    out.push(a);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const v = (a.v + b.v) / 2;
    out.push({
      x: mx + gauss() * mag * v,
      y: my + gauss() * mag * v,
      v: v * (0.8 + Math.random() * 0.4),
    });
  }
  return deform(out, mag / 2, depth - 1);
}

function tracePoly(ctx, pts, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x + pts[0].x * s, y + pts[0].y * s);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i].x * s, y + pts[i].y * s);
  ctx.closePath();
}

/* ---------------- composition ---------------- */

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// Small deterministic hash. Composition remains reproducible for the same
// session seed, event number, and dominant pitch while paint edges stay alive.
function hash01(a, b = 0, c = 0) {
  let h = (a ^ Math.imul(b + 1, 0x9e3779b1) ^ Math.imul(c + 7, 0x85ebca6b)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// The expression score is not a judgment of the song. It is a compositional
// mixer: impact, harmonic richness, tonal travel, breath, and pitch clarity.
// Quiet music can still score highly through space and harmonic intention.
function scoreExpression(pcs, level) {
  const now = performance.now();
  const root = pcs[0].pc;
  const totalW = pcs.reduce((sum, p) => sum + p.w, 0) || 1;
  const clarity = clamp01(pcs[0].w / totalW);
  const interval = pcs.length > 1
    ? Math.min(6, Math.abs(((pcs[1].pc - root + 6) % 12) - 6)) / 6
    : 0;
  const richness = pcs.length > 1 ? 0.58 + interval * 0.32 : 0.32;
  const lastFifth = compositionState.lastRoot < 0 ? root : (compositionState.lastRoot * 7) % 12;
  const nextFifth = (root * 7) % 12;
  const fifthTravel = Math.min(
    Math.abs(nextFifth - lastFifth),
    12 - Math.abs(nextFifth - lastFifth),
  ) / 6;
  const breath = compositionState.lastAt
    ? clamp01((now - compositionState.lastAt) / 4200)
    : 1;
  compositionState.energyEma = compositionState.event
    ? compositionState.energyEma * 0.72 + level * 0.28
    : level;
  const dynamicMotion = clamp01(
    Math.abs(level - compositionState.previousEnergy) * 2.4 +
    Math.abs(level - compositionState.energyEma) * 1.2,
  );
  const impact = clamp01(level);
  const total = clamp01(
    impact * 0.30 + richness * 0.20 + fifthTravel * 0.18 +
    breath * 0.14 + (clarity * 0.65 + dynamicMotion * 0.35) * 0.18,
  );
  const score = { impact, richness, tonalTravel: fifthTravel, breath, clarity, dynamicMotion, total };
  compositionState.lastAt = now;
  compositionState.lastRoot = root;
  compositionState.previousEnergy = level;
  compositionState.lastScore = score;
  return score;
}

function compositionPlacement(pcs, score) {
  const n = compositionState.event++;
  const root = pcs[0].pc;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const u = hash01(compositionState.seed, n, root);
  const v = hash01(compositionState.seed ^ 0xa341316c, n, root);
  const coverage = ((n * 7) % 17) / 16;
  const reach = clamp01(0.16 + coverage * 0.72 + score.total * 0.20);
  const pitchA = (pcHue(root) / 360) * Math.PI * 2;
  let nx = 0, ny = 0, angle = pitchA;

  switch (COMPOSITION.id) {
    case "liquid-bloom": {
      // Slow paired vortices keep successive phrases near enough to interact,
      // while the irrational turn prevents the flow from becoming a wheel.
      const t = n * golden * 0.54 + pitchA * 0.22;
      const lobe = Math.sin(n * 0.73 + root) * 0.16;
      const r = 0.2 + 0.75 * Math.sqrt(((n * 11) % 29) / 28);
      angle = t + lobe;
      nx = Math.cos(angle) * r;
      ny = Math.sin(angle) * r * (0.78 + v * 0.22);
      break;
    }
    case "sacred-rose": {
      const order = [6, 8, 10, 12][root % 4];
      const spoke = n % order;
      angle = pitchA * 0.18 + spoke * Math.PI * 2 / order;
      const tier = 0.34 + (Math.floor(n / order) % 3) * 0.3;
      nx = Math.cos(angle) * tier;
      ny = Math.sin(angle) * tier;
      break;
    }
    case "living-sand": {
      // A narrow fountain heading fans into a different quadrant each event;
      // gravity is applied later by the grain solver, not baked into placement.
      angle = pitchA + n * golden * 0.38 + (u - 0.5) * 0.34;
      const r = 0.58 + v * 0.38;
      nx = Math.cos(angle) * r;
      ny = Math.sin(angle) * r;
      break;
    }
    case "vitruvian-grove": {
      angle = pitchA * 0.35 + n * golden;
      const ring = 0.52 + ((n * 5) % 11) / 10 * 0.44;
      nx = Math.cos(angle) * ring;
      ny = Math.sin(angle) * ring;
      break;
    }
    case "golden-garden": {
      angle = n * golden + root * 0.055;
      const r = 0.16 + 0.82 * Math.sqrt(((n * 5) % 23) / 22);
      nx = Math.cos(angle) * r; ny = Math.sin(angle) * r;
      break;
    }
    case "orphic-rose": {
      const t = n * 0.49 + pitchA * 0.35;
      const r = 0.2 + 0.78 * Math.abs(Math.cos(3 * t));
      angle = t;
      nx = Math.cos(t) * r; ny = Math.sin(t) * r;
      break;
    }
    case "velvet-fan": {
      const side = n % 2 ? 1 : -1;
      const band = (Math.floor(n / 2) % 7) / 6;
      angle = -Math.PI / 2 + side * (0.13 + band * 1.12);
      const r = 0.34 + band * 0.62;
      nx = Math.cos(angle) * r; ny = Math.sin(angle) * r;
      break;
    }
    case "jazz-ribbon": {
      const t = n * 0.46 + pitchA * 0.18;
      nx = Math.sin(3 * t + 0.45) * 0.94;
      ny = Math.sin(2 * t) * 0.9;
      angle = Math.atan2(ny, nx);
      break;
    }
    case "color-tide": {
      const ring = 0.2 + ((n % 7) / 6) * 0.76;
      angle = pitchA + n * 0.72;
      nx = Math.cos(angle) * ring; ny = Math.sin(angle) * ring;
      break;
    }
    case "cathedral": {
      const side = n % 2 ? 1 : -1;
      const tier = (Math.floor(n / 2) % 6) / 5;
      angle = -Math.PI / 2 + side * (0.18 + tier * 0.72);
      const r = 0.34 + tier * 0.62;
      nx = Math.cos(angle) * r; ny = Math.sin(angle) * r;
      break;
    }
    case "constellation": {
      angle = Math.PI * 2 * u;
      const r = 0.22 + 0.76 * v;
      nx = Math.cos(angle) * r; ny = Math.sin(angle) * r;
      break;
    }
    case "afterimage": {
      const side = n % 2 ? 1 : -1;
      angle = -0.36 + (Math.floor(n / 2) % 5) * 0.18 + (side < 0 ? Math.PI : 0);
      const r = 0.42 + ((n * 3) % 7) / 6 * 0.54;
      nx = Math.cos(angle) * r; ny = Math.sin(angle) * r;
      break;
    }
    case "slow-orbit": {
      angle = n * 0.68 + pitchA * 0.16;
      const r = 0.13 + ((n % 18) / 17) * 0.84;
      nx = Math.cos(angle) * r; ny = Math.sin(angle) * r;
      break;
    }
    case "radiant-heart":
    default: {
      angle = pitchA + n * golden * 0.72 + (u - 0.5) * 0.16;
      nx = Math.cos(angle) * reach; ny = Math.sin(angle) * reach;
      break;
    }
  }

  const margin = 0.045;
  const x = Math.max(W * margin, Math.min(W * (1 - margin), W * 0.5 + nx * W * 0.475));
  const y = Math.max(H * margin, Math.min(H * (1 - margin), H * 0.5 + ny * H * 0.475));
  return { x, y, angle, gesture: COMPOSITION.gesture, seed: u, score, pc: root };
}

function samplePath(fn, steps = 34) {
  const path = [];
  for (let i = 0; i <= steps; i++) path.push(fn(i / steps));
  return path;
}

function buildGesturePaths(target) {
  const cx = W * 0.5, cy = H * 0.5;
  const dx = target.x - cx, dy = target.y - cy;
  const len = Math.max(1, Math.hypot(dx, dy));
  const px = -dy / len, py = dx / len;
  const bend = Math.min(W, H) * (0.045 + target.score.total * 0.055);
  const paths = [];
  const line = (wave, turns = 1) => samplePath(t => {
    const envelope = Math.sin(Math.PI * t);
    const off = wave * Math.sin(t * Math.PI * 2 * turns + target.seed * 5) * envelope;
    return { x: cx + dx * t + px * off, y: cy + dy * t + py * off };
  });

  switch (target.gesture) {
    case "liquid": {
      // Three neighboring streamlines make a broad current. Their phase and
      // amplitude differ enough to braid, while all still read center-first.
      paths.push(line(bend * 0.82, 1.35));
      paths.push(line(-bend * 0.58, 1.8));
      paths.push(line(bend * 0.31, 2.45));
      break;
    }
    case "sacred": {
      const order = [6, 8, 10, 12][target.pc % 4];
      const radius = Math.max(Math.min(W, H) * 0.13, Math.min(len, Math.min(W, H) * 0.46));
      const base = target.angle + target.seed * 0.18;
      const circle = (r, phase = 0) => samplePath(t => {
        const a = base + phase + t * Math.PI * 2;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      }, 72);
      const rosette = (r, inner, phase = 0) => {
        const path = [];
        for (let i = 0; i <= order * 2; i++) {
          const a = base + phase + i * Math.PI / order;
          const rr = i % 2 ? r * inner : r;
          path.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
        }
        return path;
      };
      paths.push(circle(radius));
      paths.push(circle(radius * 0.62, Math.PI / order));
      paths.push(rosette(radius * 0.96, 0.44));
      paths.push(rosette(radius * 0.6, 0.38, Math.PI / order));
      for (let i = 0; i < order; i += 2) {
        const a = base + i * Math.PI * 2 / order;
        paths.push([
          { x: cx + Math.cos(a) * radius * 0.16, y: cy + Math.sin(a) * radius * 0.16 },
          { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius },
        ]);
      }
      break;
    }
    case "sand": {
      for (let lane = -2; lane <= 2; lane++) {
        paths.push(samplePath(t => {
          const fan = lane * bend * 0.18 * t;
          const fall = Math.sin(Math.PI * t) * bend * (0.16 + Math.abs(lane) * 0.04);
          return {
            x: cx + dx * t + px * fan,
            y: cy + dy * t + py * fan + fall,
          };
        }, 26));
      }
      break;
    }
    case "wood": {
      const trunk = line(bend * 0.12, 0.55);
      paths.push(trunk);
      for (const q of [0.38, 0.62]) {
        const fork = trunk[Math.floor((trunk.length - 1) * q)];
        for (const side of [-1, 1]) {
          const remain = 1 - q;
          paths.push(samplePath(t => ({
            x: fork.x + dx * remain * t + px * side * bend * (0.45 + q * 0.32) * Math.sin(Math.PI * t * 0.72),
            y: fork.y + dy * remain * t + py * side * bend * (0.45 + q * 0.32) * Math.sin(Math.PI * t * 0.72),
          }), 22));
        }
      }
      break;
    }
    case "petal":
      paths.push(samplePath(t => ({
        x: cx + dx * t + px * Math.sin(Math.PI * t) * bend,
        y: cy + dy * t + py * Math.sin(Math.PI * t) * bend,
      })));
      paths.push(samplePath(t => ({
        x: cx + dx * t - px * Math.sin(Math.PI * t) * bend * 0.72,
        y: cy + dy * t - py * Math.sin(Math.PI * t) * bend * 0.72,
      })));
      break;
    case "arc":
      paths.push(line(bend * 0.9, 0.5));
      break;
    case "fan": {
      paths.push(line(bend * 0.6, 0.5));
      const mirrorX = W - target.x;
      const mdx = mirrorX - cx;
      paths.push(samplePath(t => ({
        x: cx + mdx * t - px * Math.sin(Math.PI * t) * bend * 0.45,
        y: cy + dy * t + py * Math.sin(Math.PI * t) * bend * 0.45,
      })));
      break;
    }
    case "ribbon":
      paths.push(line(bend * 0.82, 2.25));
      paths.push(line(-bend * 0.34, 2.25));
      break;
    case "ripple": {
      paths.push(line(bend * 0.18, 1));
      const rx = Math.max(Math.min(W, H) * 0.08, Math.abs(dx));
      const ry = Math.max(Math.min(W, H) * 0.06, Math.abs(dy));
      paths.push(samplePath(t => {
        const a = target.angle + t * Math.PI * 2;
        return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
      }, 56));
      break;
    }
    case "branch": {
      const trunk = line(bend * 0.18, 0.5);
      paths.push(trunk);
      const fork = trunk[Math.floor(trunk.length * 0.48)];
      for (const side of [-1, 1]) {
        paths.push(samplePath(t => ({
          x: fork.x + dx * 0.42 * t + px * side * bend * 0.7 * t,
          y: fork.y + dy * 0.42 * t + py * side * bend * 0.7 * t,
        }), 22));
      }
      break;
    }
    case "constellation": {
      const anchors = [{ x: cx, y: cy }];
      for (let i = 1; i < 5; i++) {
        const t = i / 5;
        const j = (hash01(compositionState.seed, compositionState.event, i) - 0.5) * bend * 1.5;
        anchors.push({ x: cx + dx * t + px * j, y: cy + dy * t + py * j });
      }
      anchors.push({ x: target.x, y: target.y });
      paths.push(anchors);
      break;
    }
    case "wave":
      paths.push(line(bend * 0.72, 1.5));
      break;
    case "spiral":
      paths.push(samplePath(t => {
        const a = target.angle - (1 - t) * Math.PI * 2.25;
        const r = len * t;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      }, 48));
      break;
    case "ray":
    default:
      paths.push(line(bend * 0.2, 1.5));
      break;
  }
  return paths;
}

/* ---------------- paint world ---------------- */

const blooms = [];
const drips = [];
const glosses = [];
const threads = [];
const gestures = [];
const originPulses = [];
const liquidParticles = [];
const sandParticles = [];
const sandSurface = [];
const woodTips = [];
const woodNodes = [];
const capillaryVeins = [];
const recentPoints = [];
const flow = { a: 0 };

// These movement solvers deliberately stay material-agnostic: they borrow the
// active skin's color functions, but own only position, momentum, and growth.

function spawnLiquidParticles(target, pc, level) {
  const cx = W * 0.5, cy = H * 0.5;
  const minD = Math.min(W, H);
  const count = Math.round(12 + target.score.total * 10 + level * 8);
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) * 0.5) / Math.max(1, count - 1);
    const a = target.angle + spread * 0.86 + gauss() * 0.13;
    const speed = minD * (0.068 + level * 0.092 + Math.random() * 0.052);
    const seedR = Math.random() * minD * 0.018;
    liquidParticles.push({
      x: cx + Math.cos(a) * seedR,
      y: cy + Math.sin(a) * seedR,
      px: cx, py: cy,
      vx: Math.cos(a) * speed - Math.sin(a) * speed * spread * 0.28,
      vy: Math.sin(a) * speed + Math.cos(a) * speed * spread * 0.28,
      r: (1.8 + Math.random() * 2.7 + target.score.impact * 1.2) * DPR,
      pc, seed: target.seed + i * 0.071,
      energy: target.score.total, born: now,
      life: 5200 + Math.random() * 2600,
    });
  }
  if (liquidParticles.length > 240) {
    liquidParticles.splice(0, liquidParticles.length - 240);
  }
}

function stepLiquid(now, dt) {
  if (!liquidParticles.length) return;
  dt = Math.min(dt, 1 / 30);
  const h = 28 * DPR;
  const rest = 6.5 * DPR;

  // A compact SPH-inspired neighborhood pass: close particles repel as
  // pressure, nearby velocities blend as viscosity, and the outer part of the
  // kernel adds gentle cohesion. It is intentionally painterly, not a CFD lab.
  for (let i = 0; i < liquidParticles.length; i++) {
    const a = liquidParticles[i];
    for (let j = i + 1; j < liquidParticles.length; j++) {
      const b = liquidParticles[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 0.0001 || d2 >= h * h) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d, ny = dy / d;
      const q = 1 - d / h;
      const pressure = d < rest
        ? (1 - d / rest) * 230 * DPR
        : -q * q * 12 * DPR;
      a.vx -= nx * pressure * dt; a.vy -= ny * pressure * dt;
      b.vx += nx * pressure * dt; b.vy += ny * pressure * dt;
      const visc = q * q * 1.9 * dt;
      const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
      a.vx += dvx * visc; a.vy += dvy * visc;
      b.vx -= dvx * visc; b.vy -= dvy * visc;
    }
  }

  const cx = W * 0.5, cy = H * 0.5;
  const minD = Math.min(W, H);
  for (let i = liquidParticles.length - 1; i >= 0; i--) {
    const p = liquidParticles[i];
    const age = (now - p.born) / p.life;
    if (age >= 1) { liquidParticles.splice(i, 1); continue; }
    p.px = p.x; p.py = p.y;
    const rx = p.x - cx, ry = p.y - cy;
    const rd = Math.max(1, Math.hypot(rx, ry));
    // Let pressure become visible only after the fluid has opened away from
    // the source. This preserves a luminous center instead of repeatedly
    // varnishing the shared launch point into an opaque spoke.
    const originFade = clamp01((rd - minD * 0.035) / (minD * 0.16));
    const vortex = Math.sin(p.seed * 17 + now * 0.00055) * 58 * DPR;
    p.vx += (-ry / rd) * vortex * dt;
    p.vy += (rx / rd) * vortex * dt;
    if (age < 0.24) {
      const lift = (1 - age / 0.24) * 42 * DPR;
      p.vx += (rx / rd) * lift * dt;
      p.vy += (ry / rd) * lift * dt;
    }
    const damping = Math.pow(0.986, dt * 60);
    p.vx *= damping; p.vy *= damping;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < p.r || p.x > W - p.r) {
      p.x = Math.max(p.r, Math.min(W - p.r, p.x)); p.vx *= -0.64;
    }
    if (p.y < p.r || p.y > H - p.r) {
      p.y = Math.max(p.r, Math.min(H - p.r, p.y)); p.vy *= -0.64;
    }
    const fade = Math.sin(Math.PI * Math.min(1, age));
    const traceAlpha = P("movementTraceAlpha") * (0.08 + originFade * 0.92);
    pctx.strokeStyle = pigmentColor(p.pc, (0.018 + fade * 0.028) * traceAlpha, p.seed);
    pctx.lineWidth = p.r * (1.5 + p.energy * 0.7);
    pctx.lineCap = "round";
    pctx.beginPath(); pctx.moveTo(p.px, p.py); pctx.lineTo(p.x, p.y); pctx.stroke();
    pctx.fillStyle = pigmentAccent(p.pc, (0.018 + fade * 0.022) * traceAlpha, p.seed + age);
    pctx.beginPath(); pctx.arc(p.x, p.y, p.r * 0.72, 0, Math.PI * 2); pctx.fill();
  }
}

function spawnSandParticles(target, pc, level) {
  const cx = W * 0.5, cy = H * 0.5;
  const minD = Math.min(W, H);
  const count = Math.round(30 + level * 34 + target.score.total * 22);
  const now = performance.now();
  for (let i = 0; i < count; i++) {
    const a = target.angle + gauss() * (0.15 + (i / count) * 0.2);
    const speed = minD * (0.13 + level * 0.2) * (0.72 + Math.random() * 0.5);
    sandParticles.push({
      x: cx + gauss() * 2 * DPR, y: cy + gauss() * 2 * DPR,
      px: cx, py: cy,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: (0.55 + Math.random() * 1.05) * DPR,
      pc, seed: target.seed + i * 0.037, born: now,
      life: 5600 + Math.random() * 2600,
    });
  }
  if (sandParticles.length > 820) sandParticles.splice(0, sandParticles.length - 820);
}

function settleSandGrain(p, col, cell) {
  p.y = Math.min(H - p.r, sandSurface[col] - p.r);
  const traceAlpha = P("movementTraceAlpha");
  pctx.fillStyle = pigmentColor(p.pc, 0.22 * traceAlpha, p.seed);
  pctx.beginPath(); pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); pctx.fill();
  pctx.fillStyle = pigmentAccent(p.pc, 0.11 * traceAlpha, p.seed + 0.4);
  pctx.beginPath(); pctx.arc(p.x - p.r * 0.25, p.y - p.r * 0.3, p.r * 0.34, 0, Math.PI * 2); pctx.fill();
  sandSurface[col] = Math.max(H * 0.48, sandSurface[col] - Math.max(p.r * 0.56, cell * 0.11));
}

function stepSand(now, dt) {
  if (!sandParticles.length) return;
  dt = Math.min(dt, 1 / 30);
  const cell = Math.max(3, 5 * DPR);
  const cols = Math.ceil(W / cell);
  if (sandSurface.length !== cols) {
    sandSurface.length = cols;
    sandSurface.fill(H - 1.5 * DPR);
  }
  const grid = new Map();
  for (let i = sandParticles.length - 1; i >= 0; i--) {
    const p = sandParticles[i];
    const age = (now - p.born) / p.life;
    if (age >= 1) { sandParticles.splice(i, 1); continue; }
    p.px = p.x; p.py = p.y;
    p.vy += 118 * DPR * dt;
    p.vx += Math.sin(now * 0.0013 + p.seed * 31) * 6 * DPR * dt;
    p.vx *= Math.pow(0.997, dt * 60);
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < p.r || p.x > W - p.r) {
      p.x = Math.max(p.r, Math.min(W - p.r, p.x)); p.vx *= -0.42;
    }
    if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.35; }

    const gx = Math.floor(p.x / cell), gy = Math.floor(p.y / cell);
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const q = grid.get(`${gx + ox}:${gy + oy}`);
      if (!q) continue;
      const dx = p.x - q.x, dy = p.y - q.y;
      const minDist = p.r + q.r;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 0.0001 || d2 >= minDist * minDist) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      const push = (minDist - d) * 0.52;
      p.x += nx * push; p.y += ny * push;
      const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
      if (rel < 0) { p.vx -= nx * rel * 0.36; p.vy -= ny * rel * 0.36; }
    }
    grid.set(`${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`, p);

    const col = Math.max(0, Math.min(cols - 1, Math.floor(p.x / cell)));
    if (p.y + p.r >= sandSurface[col]) {
      const left = sandSurface[Math.max(0, col - 1)];
      const right = sandSurface[Math.min(cols - 1, col + 1)];
      const downhill = left > right ? -1 : 1;
      const low = Math.max(left, right);
      if (low - sandSurface[col] > cell * 1.45 && col + downhill >= 0 && col + downhill < cols) {
        p.x += downhill * cell * 0.7;
        p.vx = downhill * (16 + Math.abs(p.vx) * 0.22) * DPR;
        p.vy *= -0.12;
      } else {
        settleSandGrain(p, col, cell);
        sandParticles.splice(i, 1);
        continue;
      }
    }
    pctx.fillStyle = pigmentColor(p.pc, 0.07 * P("movementTraceAlpha"), p.seed + age);
    pctx.beginPath(); pctx.arc(p.x, p.y, p.r * 0.72, 0, Math.PI * 2); pctx.fill();
  }
}

function angleDelta(to, from) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function spawnWoodGrowth(target, pc) {
  const now = performance.now();
  const arms = compositionState.event < 3 ? 4 : 2;
  for (let i = 0; i < arms; i++) {
    const opposing = i % 2 ? Math.PI : 0;
    const quarter = Math.floor(i / 2) * Math.PI * 0.5;
    const a = target.angle + opposing + quarter + gauss() * 0.045;
    woodTips.push({
      x: W * 0.5, y: H * 0.5, angle: a, targetAngle: a,
      width: (3.2 + target.score.total * 3.8) * DPR,
      step: (3.8 + target.score.impact * 2.6) * DPR,
      energy: Math.round(38 + target.score.total * 42),
      pc, seed: target.seed + i * 0.193, depth: 0, ticks: 0,
      branch: `${compositionState.event}:${i}:${target.seed}`,
      nextAt: now + i * 42,
    });
  }
  if (woodTips.length > 84) woodTips.splice(0, woodTips.length - 84);
}

function finishWoodTip(tip) {
  const r = Math.max(1.2 * DPR, tip.width * 0.72);
  pctx.save();
  pctx.translate(tip.x, tip.y); pctx.rotate(tip.angle);
  pctx.fillStyle = pigmentAccent(tip.pc, 0.17 * P("movementTraceAlpha"), tip.seed + tip.ticks);
  pctx.beginPath(); pctx.ellipse(r * 0.35, 0, r, r * 0.42, 0, 0, Math.PI * 2); pctx.fill();
  pctx.restore();
}

function stepWood(now) {
  for (let i = woodTips.length - 1; i >= 0; i--) {
    const tip = woodTips[i];
    if (now < tip.nextAt) continue;
    tip.nextAt = now + 24 + tip.depth * 4;
    const oldX = tip.x, oldY = tip.y;
    let repelX = 0, repelY = 0;
    const start = Math.max(0, woodNodes.length - 260);
    for (let n = start; n < woodNodes.length; n++) {
      const node = woodNodes[n];
      if (node.branch === tip.branch && tip.ticks - node.tick < 5) continue;
      const dx = tip.x - node.x, dy = tip.y - node.y;
      const d2 = dx * dx + dy * dy;
      const reach = 25 * DPR;
      if (d2 > tip.step * tip.step * 2.2 && d2 < reach * reach) {
        const inv = 1 / Math.max(1, d2);
        repelX += dx * inv; repelY += dy * inv;
      }
    }
    const repelAngle = Math.atan2(repelY, repelX);
    const repelWeight = Math.min(0.28, Math.hypot(repelX, repelY) * 130 * DPR);
    tip.angle += angleDelta(tip.targetAngle, tip.angle) * 0.045;
    if (repelWeight > 0.01) tip.angle += angleDelta(repelAngle, tip.angle) * repelWeight;
    tip.angle += (hash01(Math.floor(tip.seed * 1e9), tip.ticks, tip.depth) - 0.5) * 0.18;
    tip.x += Math.cos(tip.angle) * tip.step;
    tip.y += Math.sin(tip.angle) * tip.step;
    tip.ticks++; tip.energy--; tip.width *= 0.986;

    const traceAlpha = P("movementTraceAlpha");
    pctx.strokeStyle = pigmentColor(tip.pc, 0.14 * traceAlpha, tip.seed + tip.ticks * 0.01);
    pctx.lineWidth = Math.max(0.7 * DPR, tip.width);
    pctx.lineCap = "round";
    pctx.beginPath(); pctx.moveTo(oldX, oldY); pctx.lineTo(tip.x, tip.y); pctx.stroke();
    pctx.strokeStyle = pigmentAccent(tip.pc, 0.055 * traceAlpha, tip.seed + 0.5);
    pctx.lineWidth = Math.max(0.35 * DPR, tip.width * 0.22);
    pctx.beginPath(); pctx.moveTo(oldX, oldY); pctx.lineTo(tip.x, tip.y); pctx.stroke();
    woodNodes.push({ x: tip.x, y: tip.y, branch: tip.branch, tick: tip.ticks });
    if (woodNodes.length > 1400) woodNodes.splice(0, woodNodes.length - 1400);

    const splitEvery = 11 + tip.depth * 4;
    const split = tip.depth < 4 && tip.energy > 12 && tip.ticks % splitEvery === 0 &&
      hash01(Math.floor(tip.seed * 1e8), tip.ticks, tip.depth) > 0.34;
    if (split && woodTips.length < 82) {
      const turn = 0.38 + hash01(Math.floor(tip.seed * 1e7), tip.ticks, 9) * 0.34;
      const child = {
        ...tip,
        angle: tip.angle + turn,
        targetAngle: tip.targetAngle + turn * 1.4,
        width: tip.width * 0.72,
        energy: Math.round(tip.energy * 0.68),
        depth: tip.depth + 1,
        seed: tip.seed + 0.271 + tip.depth * 0.13,
        branch: `${tip.branch}.${tip.ticks}`,
        ticks: 0,
        nextAt: now + 36,
      };
      woodTips.push(child);
      tip.angle -= turn * 0.36;
      tip.targetAngle -= turn * 0.52;
    }
    const out = tip.x < -tip.step || tip.x > W + tip.step || tip.y < -tip.step || tip.y > H + tip.step;
    if (tip.energy <= 0 || tip.width < 0.75 * DPR || out) {
      if (!out) finishWoodTip(tip);
      woodTips.splice(i, 1);
    }
  }
}

function spawnSpecialMovement(target, pc, level) {
  switch (target.gesture) {
    case "liquid": spawnLiquidParticles(target, pc, level); break;
    case "sand": spawnSandParticles(target, pc, level); break;
    case "wood": spawnWoodGrowth(target, pc); break;
  }
}

function stepSpecialMovements(now, dt) {
  stepLiquid(now, dt);
  stepSand(now, dt);
  stepWood(now);
}

function spawnCapillaryVeins(bloom, level, delay) {
  const intensity = P("capillary");
  if (intensity <= 0 || bloom.quiet) return;
  const count = Math.round(2 + intensity * 4 + level * 2);
  const now = performance.now() + delay + 180;
  for (let i = 0; i < count; i++) {
    const angle = flow.a + (i / count) * Math.PI * 2 + gauss() * 0.13;
    const budget = bloom.r * (0.48 + intensity * 0.48 + Math.random() * 0.26);
    capillaryVeins.push({
      x: bloom.x + Math.cos(angle) * bloom.r * 0.05,
      y: bloom.y + Math.sin(angle) * bloom.r * 0.05,
      angle, step: (0.95 + intensity * 1.35 + Math.random() * 0.75) * DPR,
      budget, budget0: budget,
      width: (0.42 + intensity * 0.92 + level * 0.32) * DPR,
      pc: bloom.pc, seed: bloom.seed + i * 0.149,
      born: now + i * 38, nextAt: now + i * 38,
      tick: 0, depth: 0,
    });
  }
  if (capillaryVeins.length > 96) {
    capillaryVeins.splice(0, capillaryVeins.length - 96);
  }
}

function finishCapillary(v) {
  const leaf = P("leafAlpha");
  if (leaf <= 0) return;
  const r = (0.8 + hash01(Math.floor(v.seed * 1e8), v.tick, 3) * 1.8) * DPR;
  pctx.save();
  pctx.translate(v.x, v.y);
  pctx.rotate(v.angle + 0.7);
  pctx.fillStyle = pigmentAccent(v.pc, leaf * 0.55, v.seed + v.tick);
  pctx.beginPath();
  pctx.moveTo(-r, -r * 0.22);
  pctx.lineTo(r * 0.12, -r * 0.7);
  pctx.lineTo(r, r * 0.06);
  pctx.lineTo(-r * 0.18, r * 0.64);
  pctx.closePath();
  pctx.fill();
  pctx.restore();
}

function stepCapillaryVeins(now) {
  for (let i = capillaryVeins.length - 1; i >= 0; i--) {
    const v = capillaryVeins[i];
    if (now < v.nextAt) continue;
    v.nextAt = now + 22 + v.depth * 5;
    const oldX = v.x, oldY = v.y;
    const curl = Math.sin(v.x / (29 * DPR) + v.seed * 19 + v.tick * 0.071)
      + Math.cos(v.y / (37 * DPR) - v.seed * 13 - v.tick * 0.047);
    v.angle += curl * 0.055 + (hash01(Math.floor(v.seed * 1e9), v.tick, v.depth) - 0.5) * 0.12;
    v.x += Math.cos(v.angle) * v.step;
    v.y += Math.sin(v.angle) * v.step;
    v.budget -= v.step;
    v.tick++;
    const life = Math.max(0, v.budget / v.budget0);
    pctx.strokeStyle = pigmentSpectral(v.pc, (0.035 + life * 0.08) * P("capillary"), v.seed, v.tick * 0.065);
    pctx.lineWidth = Math.max(0.32 * DPR, v.width * (0.35 + life * 0.65));
    pctx.lineCap = "round";
    pctx.beginPath(); pctx.moveTo(oldX, oldY); pctx.lineTo(v.x, v.y); pctx.stroke();

    const splitEvery = 13 + v.depth * 7;
    if (v.depth < 2 && v.budget > v.budget0 * 0.28 && v.tick % splitEvery === 0 &&
        capillaryVeins.length < 94) {
      const side = hash01(Math.floor(v.seed * 1e7), v.tick, 41) > 0.5 ? 1 : -1;
      capillaryVeins.push({
        ...v,
        angle: v.angle + side * (0.4 + hash01(Math.floor(v.seed * 1e6), v.tick, 7) * 0.42),
        budget: v.budget * 0.58,
        budget0: v.budget * 0.58,
        width: v.width * 0.62,
        seed: v.seed + 0.317 + v.depth * 0.11,
        depth: v.depth + 1,
        tick: 0,
        nextAt: now + 34,
      });
      v.angle -= side * 0.16;
    }
    if (v.budget <= 0 || v.x < 0 || v.x > W || v.y < 0 || v.y > H) {
      if (v.x >= 0 && v.x <= W && v.y >= 0 && v.y <= H) finishCapillary(v);
      capillaryVeins.splice(i, 1);
    }
  }
}

function spawnCompositionGesture(target, pc) {
  const now = performance.now();
  const paths = buildGesturePaths(target);
  paths.forEach((path, i) => {
    const quiet = target.gesture === "sand" || target.gesture === "wood";
    const precise = target.gesture === "sacred";
    gestures.push({
      path, pc, seed: target.seed + i * 0.17,
      alpha: Math.min(
        precise ? 0.28 : 0.34,
        P("threadAlpha") * (quiet ? 0.2 : 0.38 + target.score.total * 0.42),
      ),
      width: (0.9 + target.score.impact * (precise ? 1.4 : 2.2)) * DPR * (i ? 0.68 : 1),
      born: now + i * 55,
      dur: (precise ? 900 : 650) + path.length * 10 + (1 - target.score.impact) * 420,
      drawn: 0,
    });
  });
  if (gestures.length > 72) gestures.splice(0, gestures.length - 72);
  const seedAngle = (pc / 12) * Math.PI * 2 + compositionState.event * 0.21;
  const seedRadius = Math.min(W, H) * (0.008 + target.score.total * 0.012);
  const seedX = W * 0.5 + Math.cos(seedAngle) * seedRadius;
  const seedY = H * 0.5 + Math.sin(seedAngle) * seedRadius;
  for (let i = 0; i < 3; i++) {
    pctx.fillStyle = pigmentAccent(pc, 0.055, target.seed + i * 0.23);
    pctx.beginPath();
    pctx.arc(
      seedX + gauss() * 0.45 * DPR,
      seedY + gauss() * 0.45 * DPR,
      (1.2 + target.score.total * 2.2 - i * 0.22) * DPR,
      0, Math.PI * 2,
    );
    pctx.fill();
  }
  originPulses.push({
    pc, seed: target.seed, score: target.score.total, gesture: target.gesture,
    order: [6, 8, 10, 12][pc % 4], born: now, life: target.gesture === "sacred" ? 2400 : 1750,
  });
  if (originPulses.length > 8) originPulses.shift();
  return paths;
}

function stepGestures(now) {
  for (let i = gestures.length - 1; i >= 0; i--) {
    const g = gestures[i];
    const t = (now - g.born) / g.dur;
    if (t < 0) continue;
    const eased = 1 - Math.pow(1 - Math.min(1, t), 3);
    const target = Math.max(1, Math.floor(eased * (g.path.length - 1)));
    if (target > g.drawn) {
      pctx.strokeStyle = pigmentColor(g.pc, g.alpha, g.seed);
      pctx.lineWidth = g.width * (1 - eased * 0.28);
      pctx.lineCap = "round";
      pctx.lineJoin = "round";
      pctx.beginPath();
      const start = g.path[Math.max(0, g.drawn - 1)];
      pctx.moveTo(start.x, start.y);
      for (let p = g.drawn; p <= target; p++) pctx.lineTo(g.path[p].x, g.path[p].y);
      pctx.stroke();
      g.drawn = target + 1;
    }
    if (t >= 1) gestures.splice(i, 1);
  }
}

function rememberPoint(x, y, pc) {
  recentPoints.push({ x, y, pc });
  if (recentPoints.length > 14) recentPoints.shift();
}

function spawnThreads(x, y, pc) {
  if (ctl.thread < 0.05 || recentPoints.length === 0 || threads.length > 6) return;
  const minD = Math.min(W, H);
  let want = (Math.random() < ctl.thread ? 1 : 0)
           + (Math.random() < ctl.thread * 0.55 ? 1 : 0);
  const pool = [...recentPoints].sort(() => Math.random() - 0.5);
  for (const p of pool) {
    if (!want) break;
    const dist = Math.hypot(p.x - x, p.y - y);
    if (dist < minD * 0.08 || dist > minD * (0.3 + ctl.thread * 0.45)) continue;
    const sag = dist * (0.10 + Math.random() * 0.14);
    threads.push({
      x0: x, y0: y, x1: p.x, y1: p.y,
      cx: (x + p.x) / 2 + gauss() * dist * 0.08,
      cy: (y + p.y) / 2 + sag,
      pc, seed: Math.random(),
      w: (1.3 + Math.random() * 1.3) * DPR,
      born: performance.now() + 250,
      dur: 900 + Math.random() * 700,
      p: 0,
    });
    want--;
  }
}

function stepThreads(now) {
  for (let i = threads.length - 1; i >= 0; i--) {
    const th = threads[i];
    const t = (now - th.born) / th.dur;
    if (t < 0) continue;
    const target = Math.min(1, t);
    if (target - th.p < 0.03 && target < 1) continue;
    pctx.strokeStyle = pigmentColor(th.pc, P("threadAlpha"), th.seed);
    pctx.lineWidth = th.w;
    pctx.lineCap = "round";
    pctx.beginPath();
    const bez = q => {
      const u = 1 - q;
      return [u * u * th.x0 + 2 * u * q * th.cx + q * q * th.x1,
              u * u * th.y0 + 2 * u * q * th.cy + q * q * th.y1];
    };
    const [sx, sy] = bez(th.p);
    pctx.moveTo(sx, sy);
    for (let p = th.p + 0.02; p < target; p += 0.02) pctx.lineTo(...bez(p));
    pctx.lineTo(...bez(target));
    pctx.stroke();
    th.p = target;
    if (th.p >= 1) {
      if (P("threadNodes")) {
        for (const [nx, ny] of [[th.x0, th.y0], [th.x1, th.y1]]) {
          pctx.fillStyle = pigmentAccent(th.pc, 0.22, th.seed + nx);
          pctx.beginPath();
          pctx.arc(nx, ny, th.w * (1.6 + Math.random() * 0.8), 0, Math.PI * 2);
          pctx.fill();
        }
      }
      threads.splice(i, 1);
    }
  }
}

function spawnStrike(pcs, level) {
  const root = pcs[0].pc;
  const hasMin3 = pcs.some(p => p.pc === (root + 3) % 12);
  const hasMaj3 = pcs.some(p => p.pc === (root + 4) % 12);
  const quality = hasMin3 && !hasMaj3 ? 0 : 1;

  const expression = scoreExpression(pcs, level);
  const target = compositionPlacement(pcs, expression);
  const x = target.x, y = target.y;
  const minD = Math.min(W, H);
  flow.a = target.angle + gauss() * 0.14;
  if (P("leanMode") === "vertical") flow.a = Math.PI / 2 + gauss() * 0.12;
  const gesturePaths = spawnCompositionGesture(target, pcs[0].pc);
  spawnSpecialMovement(target, pcs[0].pc, level);
  spawnThreads(x, y, pcs[0].pc);
  rememberPoint(x, y, pcs[0].pc);

  const movementScale = target.gesture === "sand" ? 0.42
    : target.gesture === "wood" ? 0.52
    : target.gesture === "sacred" ? 0.64
    : target.gesture === "liquid" ? 0.76 : 1;
  const sizeBase = (0.03 + ctl.size * 0.065) * minD *
    (0.68 + Math.random() * 0.48) * P("sizeMul") * (0.78 + expression.total * 0.28);
  const scaledSize = sizeBase * movementScale;
  const total = pcs.reduce((s, p) => s + p.w, 0) || 1;

  // Small traveling stains make the gesture feel painted through space,
  // rather than a wire connecting isolated stamps. They stay translucent
  // and dry so the center-to-edge route remains visible without clutter.
  const echoCount = target.gesture === "sand" || target.gesture === "wood"
    ? 0 : expression.total > 0.68 ? 2 : 1;
  for (let i = 0; i < echoCount; i++) {
    const path = gesturePaths[i % gesturePaths.length];
    const q = 0.34 + (i / Math.max(1, echoCount - 1)) * 0.32;
    const point = path[Math.min(path.length - 1, Math.floor(q * path.length))];
    spawnBloom(
      point.x, point.y, scaledSize * (0.19 + expression.total * 0.07),
      root, level * 0.7, 110 + i * 120, quality,
      { alphaMul: 0.34, layerMul: 0.48, quiet: true },
    );
  }

  if (target.gesture === "sacred") {
    const order = [6, 8, 10, 12][root % 4];
    const jewelR = minD * (0.085 + expression.total * 0.055);
    for (let i = 0; i < order; i += 2) {
      const a = target.angle + i * Math.PI * 2 / order;
      const tone = pcs[(i / 2) % pcs.length].pc;
      spawnBloom(
        W * 0.5 + Math.cos(a) * jewelR,
        H * 0.5 + Math.sin(a) * jewelR,
        scaledSize * 0.12, tone, level * 0.72, 260 + i * 24, quality,
        { alphaMul: 0.42, layerMul: 0.42, quiet: true },
      );
    }
  }

  pcs.forEach((p, i) => {
    const share = p.w / total;
    const r = scaledSize * (i === 0 ? 0.95 : 0.4 + share * 0.45) * (0.75 + level * 0.5);
    const a = Math.random() * Math.PI * 2;
    const d = i === 0 ? 0 : scaledSize * (0.5 + Math.random() * 0.35);
    spawnBloom(x + Math.cos(a) * d, y + Math.sin(a) * d, r, p.pc, level, i * 80, quality);
  });
}

function spawnBloom(x, y, r, pc, level, delay, quality = 1, options = {}) {
  const seed = Math.random();
  const [stMin, stVar] = P("stretch");
  const stretch = stMin + Math.random() * stVar;
  const ca = Math.cos(flow.a), sa = Math.sin(flow.a);
  const poly = deform(basePolygon(r), r * P("deformInit"), P("deformDepth")).map(p => {
    const ex = p.x * stretch, ey = p.y * (0.82 + Math.random() * 0.06);
    return { x: ex * ca - ey * sa, y: ex * sa + ey * ca, v: p.v };
  });
  const [lBase, lVar] = P("layerCount");
  const layers = Math.max(3, Math.round((lBase + ctl.bleed * lVar) * (options.layerMul || 1)));
  const bloom = {
    x, y, r, pc, seed, poly, layers, quality, quiet: !!options.quiet,
    driftA: Math.random() * Math.PI * 2,
    edgeSoft: 0.7 + Math.random() * 0.6,
    aMul: Math.min(1.5, Math.max(1, 1.6 - r / (Math.min(W, H) * 0.07))) * (options.alphaMul || 1),
    born: performance.now() + delay,
    life: 1400 + ctl.bleed * 900,
    drawn: 0,
  };
  blooms.push(bloom);
  spawnCapillaryVeins(bloom, level, delay);
  if (delay === 0) drawBloomLayers(bloom, Math.ceil(layers * 0.34));
  const splat = P("splat");
  if (!options.quiet && splat > 0) {
    const n = Math.round(splat * (4 + level * 8));
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const d = r * (1.1 + Math.random() * splat * 2.2);
      pctx.fillStyle = pigmentColor(pc, 0.2 + Math.random() * 0.25, seed + k, quality);
      pctx.beginPath();
      pctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d,
               (0.7 + Math.random() * 1.8) * DPR, 0, Math.PI * 2);
      pctx.fill();
    }
  }
  if (!options.quiet && P("glossAlpha") > 0) {
    glosses.push({ x, y, r: r * 0.8, pc, seed, born: performance.now() + delay, life: 7000 });
  }
  if (!options.quiet && ctl.drip > 0.15 && Math.random() < 0.28 + ctl.drip * 0.35) {
    const side = P("gravity") >= 0 ? 1 : -1;   // sparks break from the top
    drips.push({
      x: x + (Math.random() - 0.5) * r * 0.6,
      y: y + side * r * (0.2 + Math.random() * 0.3),
      w: (2.6 + Math.random() * 2.4 + level * 2.5) * DPR * P("dripWidthMul"),
      pc, seed: Math.random(),
      budget: r * (0.8 + ctl.drip * 3.2) * (0.6 + Math.random() * 0.8),
      born: performance.now() + delay + 500 + Math.random() * 900,
      phase: Math.random() * 100,
      drift: (Math.random() - 0.5) * 0.12,
    });
  }
}

function drawBloomLayers(b, target) {
  while (b.drawn < target) {
    const frac = b.drawn / b.layers;
    const s = (0.55 + frac * 0.5) * (0.96 + Math.random() * 0.08);
    const dx = Math.cos(b.driftA) * frac * b.r * 0.10;
    const dy = Math.sin(b.driftA) * frac * b.r * 0.10;
    const run = Math.floor(b.drawn / 5);
    const hueOff = Math.sin(b.seed * 40 + run * 2.1) * 9;
    const variant = deform(b.poly.map(p => ({ ...p })), b.r * P("deformLayer") * b.edgeSoft, 2);
    const alpha = (P("layerAlphaBase") + P("layerAlphaVar") * (1 - frac)) * (b.aMul || 1);
    const strokeMode = b.quiet ? "wash" : P("strokeMode");
    if (P("ringed")) {
      // suminagashi: concentric floating rings instead of filled washes
      pctx.strokeStyle = pigmentColor(b.pc, Math.min(1, alpha * 2.4), b.seed + b.drawn, b.quality, hueOff);
      pctx.lineWidth = (0.8 + Math.random() * 1.3) * DPR;
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s);
      pctx.stroke();
    } else if (strokeMode === "airbrush") {
      const rr = Math.max(2, b.r * s * 1.15);
      const grad = pctx.createRadialGradient(
        b.x + dx - rr * 0.18, b.y + dy - rr * 0.16, rr * 0.04,
        b.x + dx, b.y + dy, rr,
      );
      grad.addColorStop(0, pigmentColor(b.pc, alpha * 0.72, b.seed + b.drawn, b.quality, hueOff));
      grad.addColorStop(0.62, pigmentColor(b.pc, alpha, b.seed + b.drawn + 0.2, b.quality, hueOff));
      grad.addColorStop(1, pigmentColor(b.pc, 0, b.seed + b.drawn + 0.4, b.quality, hueOff));
      pctx.fillStyle = grad;
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s * 1.12);
      pctx.fill();
    } else if (strokeMode === "nacre") {
      // A translucent mineral body carries curved interference bands like
      // nacre. The bands are clipped to the wet silhouette, so the effect
      // remains a material property rather than a decorative overlay.
      pctx.fillStyle = pigmentColor(b.pc, alpha * 0.92, b.seed + b.drawn, b.quality, hueOff);
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s);
      pctx.fill();
      pctx.save();
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s * 1.015);
      pctx.clip();
      const interference = P("interferenceAlpha");
      if (interference > 0 && b.drawn % 2 === 0) {
        for (let band = 0; band < 3; band++) {
          const phase = frac * 2.4 + band * 0.37 + b.seed * 4.7;
          const radius = b.r * s * (0.24 + frac * 0.54 + band * 0.11);
          pctx.strokeStyle = pigmentSpectral(
            b.pc,
            interference * (0.13 + (1 - frac) * 0.11),
            b.seed + b.drawn * 0.07 + band,
            phase,
          );
          pctx.lineWidth = (0.65 + (1 - frac) * 1.35 + band * 0.24) * DPR;
          pctx.beginPath();
          pctx.ellipse(
            b.x + dx - Math.cos(flow.a) * b.r * 0.08,
            b.y + dy - Math.sin(flow.a) * b.r * 0.08,
            radius * (1.38 + band * 0.08), radius * (0.48 + band * 0.035),
            flow.a + Math.sin(phase) * 0.18,
            -Math.PI * 0.18, Math.PI * (1.28 + band * 0.12),
          );
          pctx.stroke();
        }
      }
      const leaf = P("leafAlpha");
      if (leaf > 0 && b.drawn % 4 === 0) {
        const flakes = Math.round(2 + leaf * 5);
        for (let flake = 0; flake < flakes; flake++) {
          const h0 = hash01(Math.floor(b.seed * 1e9), b.drawn, flake);
          const h1 = hash01(Math.floor(b.seed * 1e8), flake, b.drawn + 17);
          const a = h0 * Math.PI * 2;
          const rr = Math.sqrt(h1) * b.r * s * 0.72;
          const fx = b.x + dx + Math.cos(a) * rr;
          const fy = b.y + dy + Math.sin(a) * rr;
          const fr = (0.8 + h0 * 2.5) * DPR;
          pctx.fillStyle = pigmentAccent(b.pc, leaf * (0.16 + h1 * 0.22), b.seed + flake + frac);
          pctx.beginPath();
          pctx.moveTo(fx - fr, fy - fr * 0.18);
          pctx.lineTo(fx - fr * 0.08, fy - fr * 0.74);
          pctx.lineTo(fx + fr, fy + fr * 0.08);
          pctx.lineTo(fx + fr * 0.12, fy + fr * 0.62);
          pctx.closePath();
          pctx.fill();
        }
      }
      pctx.restore();
    } else if (strokeMode === "impasto") {
      pctx.fillStyle = pigmentColor(b.pc, alpha * 1.15, b.seed + b.drawn, b.quality, hueOff);
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s);
      pctx.fill();
      if (b.drawn % 3 === 0) {
        pctx.strokeStyle = pigmentColor(
          b.pc, Math.min(0.28, alpha * 2.1), b.seed + b.drawn + 0.31, b.quality, hueOff,
        );
        pctx.lineWidth = (0.65 + (1 - frac) * 1.55) * DPR;
        pctx.stroke();
      }
    } else if (strokeMode === "stipple") {
      const dots = Math.round((4 + b.r / (24 * DPR)) * P("stippleDensity"));
      pctx.fillStyle = pigmentColor(
        b.pc, Math.min(0.62, alpha * 4.2), b.seed + b.drawn, b.quality, hueOff,
      );
      for (let dot = 0; dot < dots; dot++) {
        const da = Math.random() * Math.PI * 2;
        const dr = Math.sqrt(Math.random()) * b.r * s * 0.82;
        pctx.beginPath();
        pctx.arc(
          b.x + dx + Math.cos(da) * dr,
          b.y + dy + Math.sin(da) * dr,
          (0.75 + Math.random() * 1.65) * DPR,
          0, Math.PI * 2,
        );
        pctx.fill();
      }
    } else {
      pctx.fillStyle = pigmentColor(b.pc, alpha, b.seed + b.drawn, b.quality, hueOff);
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s);
      pctx.fill();
    }
    b.drawn++;
  }
}

function granulate(b) {
  const n = Math.round(14 + b.r * 0.12);
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * b.r * 0.8;
    pctx.fillStyle = pigmentColor(b.pc, 0.05 + Math.random() * 0.05, b.seed + k, b.quality);
    pctx.beginPath();
    pctx.arc(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr,
             (0.5 + Math.random() * 1.1) * DPR, 0, Math.PI * 2);
    pctx.fill();
  }
}

function stepBlooms(now) {
  for (let i = blooms.length - 1; i >= 0; i--) {
    const b = blooms[i];
    const t = (now - b.born) / b.life;
    if (t < 0) continue;
    if (t >= 1) {
      drawBloomLayers(b, b.layers);
      if (!b.quiet && P("granulate")) granulate(b);
      if (!b.quiet && P("edgeAlpha") > 0) {
        const edge = deform(b.poly.map(p => ({ ...p })), b.r * 0.04, 2);
        pctx.strokeStyle = pigmentEdge(b.pc, P("edgeAlpha"));
        pctx.lineWidth = 0.9 * DPR;
        tracePoly(pctx, edge, b.x, b.y, 1.02);
        pctx.stroke();
      }
      blooms.splice(i, 1);
      continue;
    }
    const eased = 1 - Math.pow(1 - t, 3);
    drawBloomLayers(b, Math.floor(eased * b.layers));
  }
}

function stepDrips(now, dt) {
  for (let i = drips.length - 1; i >= 0; i--) {
    const d = drips[i];
    if (now < d.born) continue;
    if (d.budget <= 0 || d.w < 1.2 * DPR) {
      if (P("dripBead")) {
        for (let k = 0; k < 6; k++) {
          pctx.fillStyle = pigmentAccent(d.pc, 0.05, d.seed + k);
          pctx.beginPath();
          pctx.arc(d.x + gauss() * 0.5, d.y + d.w * 0.3 + gauss() * 0.5,
                   d.w * (1.15 - k * 0.06), 0, Math.PI * 2);
          pctx.fill();
        }
      }
      drips.splice(i, 1);
      continue;
    }
    const speed = (9 + ctl.drip * 30) * DPR;
    const slip = 0.4 + 0.6 * Math.sin(now / 1300 + d.phase) ** 2;
    const dy = speed * slip * dt * P("gravity");
    const nx = d.x + d.drift * dy
             + (Math.sin(now / 2400 + d.phase * 3) * 0.07
              + Math.sin(now / 830 + d.phase * 7) * 0.045) * DPR;
    const ny = d.y + dy;
    const frac = d.budget / (d.budget0 || (d.budget0 = d.budget));
    const wNow = d.w * (frac > 0.33 ? 1 : 0.55 + frac * 1.36);
    pctx.strokeStyle = pigmentColor(d.pc, P("dripAlpha"), d.seed);
    pctx.lineWidth = wNow;
    pctx.lineCap = "round";
    pctx.beginPath();
    pctx.moveTo(d.x, d.y);
    pctx.lineTo(nx, ny);
    pctx.stroke();
    d.x = nx; d.y = ny;
    d.budget -= Math.abs(dy);
  }
}

function stepGloss(now) {
  wctx.clearRect(0, 0, W, H);
  const gA = P("glossAlpha");
  for (let i = glosses.length - 1; i >= 0; i--) {
    const g = glosses[i];
    const t = (now - g.born) / g.life;
    if (t < 0) continue;
    if (t >= 1) { glosses.splice(i, 1); continue; }
    const a = gA * (1 - t) * (t < 0.1 ? t / 0.1 : 1);
    const gx = g.x - g.r * 0.25, gy = g.y - g.r * 0.3;
    const grad = wctx.createRadialGradient(gx, gy, 0, gx, gy, g.r * 0.9);
    grad.addColorStop(0, `oklch(1 0 0 / ${a.toFixed(3)})`);
    grad.addColorStop(1, "oklch(1 0 0 / 0)");
    wctx.fillStyle = grad;
    wctx.beginPath();
    wctx.arc(gx, gy, g.r * 0.9, 0, Math.PI * 2);
    wctx.fill();
    const caustic = P("causticAlpha");
    if (caustic > 0) {
      for (let band = 0; band < 2; band++) {
        const phase = now * 0.00022 + g.seed * 7 + band * 0.63;
        wctx.strokeStyle = pigmentSpectral(
          g.pc,
          caustic * a * (0.72 - band * 0.2),
          g.seed + band,
          phase,
        );
        wctx.lineWidth = (0.8 + band * 0.65) * DPR * (1 - t * 0.55);
        wctx.beginPath();
        wctx.ellipse(
          g.x - Math.cos(phase) * g.r * 0.12,
          g.y - Math.sin(phase) * g.r * 0.1,
          g.r * (0.58 + band * 0.17), g.r * (0.22 + band * 0.06),
          phase * 0.27,
          -Math.PI * 0.15, Math.PI * (0.78 + band * 0.18),
        );
        wctx.stroke();
      }
    }
  }
  for (let i = originPulses.length - 1; i >= 0; i--) {
    const pulse = originPulses[i];
    const t = (now - pulse.born) / pulse.life;
    if (t < 0) continue;
    if (t >= 1) { originPulses.splice(i, 1); continue; }
    const eased = 1 - Math.pow(1 - t, 4);
    const reach = 0.035 + eased * (0.93 + pulse.score * 0.05);
    const rx = W * 0.5 * reach;
    const ry = H * 0.5 * reach;
    const alpha = Math.sin(Math.PI * t) * (0.055 + pulse.score * 0.07);
    wctx.strokeStyle = pigmentColor(pulse.pc, alpha, pulse.seed);
    wctx.lineWidth = (1.1 + pulse.score * 1.8) * DPR * (1 - t * 0.45);
    wctx.save();
    if (pulse.gesture === "sacred") {
      const r = Math.min(rx, ry);
      wctx.translate(W * 0.5, H * 0.5);
      wctx.rotate(pulse.seed * 0.3 + t * 0.22);
      wctx.beginPath();
      for (let p = 0; p <= pulse.order * 2; p++) {
        const a = p * Math.PI / pulse.order;
        const rr = p % 2 ? r * 0.46 : r;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (!p) wctx.moveTo(x, y); else wctx.lineTo(x, y);
      }
      wctx.stroke();
      wctx.globalAlpha = 0.55;
      wctx.beginPath(); wctx.arc(0, 0, r * 0.64, 0, Math.PI * 2); wctx.stroke();
    } else if (pulse.gesture === "liquid") {
      for (let l = -1; l <= 1; l++) {
        wctx.beginPath();
        wctx.ellipse(
          W * 0.5 + l * rx * 0.025, H * 0.5 - l * ry * 0.018,
          rx * (1 - Math.abs(l) * 0.035), ry * (0.88 + Math.abs(l) * 0.055),
          l * 0.045 + Math.sin(pulse.seed * 9) * 0.025, 0, Math.PI * 2,
        );
        wctx.stroke();
      }
    } else if (pulse.gesture === "sand") {
      wctx.setLineDash([1.2 * DPR, (3.5 + pulse.score * 3) * DPR]);
      wctx.lineCap = "round";
      wctx.beginPath();
      wctx.ellipse(W * 0.5, H * 0.5, rx, ry, 0, 0, Math.PI * 2);
      wctx.stroke();
    } else if (pulse.gesture === "wood") {
      wctx.beginPath();
      const points = 18;
      for (let p = 0; p <= points; p++) {
        const a = p * Math.PI * 2 / points;
        const rough = 0.9 + hash01(Math.floor(pulse.seed * 1e7), p, 4) * 0.16;
        const x = W * 0.5 + Math.cos(a) * rx * rough;
        const y = H * 0.5 + Math.sin(a) * ry * rough;
        if (!p) wctx.moveTo(x, y); else wctx.lineTo(x, y);
      }
      wctx.stroke();
    } else {
      wctx.beginPath();
      wctx.ellipse(W * 0.5, H * 0.5, rx, ry, 0, 0, Math.PI * 2);
      wctx.stroke();
    }
    wctx.restore();
  }
  if (liquidParticles.length) {
    for (let i = 0; i < liquidParticles.length; i += 4) {
      const p = liquidParticles[i];
      const age = Math.min(1, (now - p.born) / p.life);
      const alpha = Math.sin(Math.PI * age) * 0.13;
      wctx.fillStyle = `oklch(1 0 0 / ${alpha.toFixed(3)})`;
      wctx.beginPath();
      wctx.arc(p.x - p.r * 0.32, p.y - p.r * 0.36, Math.max(0.6 * DPR, p.r * 0.18), 0, Math.PI * 2);
      wctx.fill();
    }
  }
}

let fadeAcc = 0;
function stepFade(dt) {
  if (ctl.fade < 0.05) return;
  fadeAcc += dt * ctl.fade;
  if (fadeAcc > 0.35) {
    pctx.save();
    pctx.globalCompositeOperation = "destination-out";
    pctx.fillStyle = "rgba(0,0,0,0.012)";
    pctx.fillRect(0, 0, W, H);
    pctx.restore();
    fadeAcc = 0;
  }
}

/* ---------------- audio ---------------- */

const AC = window.AudioContext || window.webkitAudioContext;
let ac = null, analyser = null, srcNode = null;
let freqData = null, prevMag = null, timeData = null;
let source = "off";
let micStream = null;

const status = document.getElementById("status");
const notesEl = document.getElementById("notes");
const listeningEl = document.getElementById("listening");

function ensureCtx() {
  if (!ac) {
    ac = new AC();
    analyser = ac.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.4;
    freqData = new Float32Array(analyser.frequencyBinCount);
    timeData = new Float32Array(analyser.fftSize);
    prevMag = new Float32Array(analyser.frequencyBinCount);
  }
  if (ac.state === "suspended") ac.resume();
}

async function startMic() {
  ensureCtx();
  stopDemo();
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    document.getElementById("micErr").style.display = "block";
    setSource("off");
    return false;
  }
  document.getElementById("micErr").style.display = "none";
  if (srcNode) srcNode.disconnect();
  srcNode = ac.createMediaStreamSource(micStream);
  srcNode.connect(analyser);
  setSource("mic");
  return true;
}

function stopMic() {
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  if (srcNode) { srcNode.disconnect(); srcNode = null; }
}

let demo = { on: false, gain: null, nextTime: 0, step: 0 };
const DEMO_CHORDS = [
  [48, 55, 60, 64], [43, 55, 59, 62], [45, 52, 57, 60], [41, 53, 57, 60],
  [48, 55, 60, 64], [45, 52, 57, 60], [50, 57, 62, 65], [43, 55, 59, 62],
];

function pluck(midi, when, vel) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = f;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vel, when + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, when + 2.6);
  osc.connect(g); g.connect(demo.gain);
  osc.start(when); osc.stop(when + 2.8);
}

function scheduleDemo() {
  if (!demo.on) return;
  while (demo.nextTime < ac.currentTime + 6) {
    const chord = DEMO_CHORDS[demo.step % DEMO_CHORDS.length];
    demo.step++;
    const t = demo.nextTime;
    chord.forEach((m, i) => pluck(m, t + i * 0.045, 0.16 + Math.random() * 0.06));
    demo.nextTime = t + 2.4 + Math.random() * 0.5;
  }
}

function startDemo() {
  ensureCtx();
  stopMic();
  if (!demo.gain) {
    demo.gain = ac.createGain();
    demo.gain.gain.value = 1;
    demo.gain.connect(analyser);
    const out = ac.createGain();
    out.gain.value = 0.5;
    demo.gain.connect(out);
    out.connect(ac.destination);
  }
  demo.on = true;
  demo.step = 0;
  demo.nextTime = ac.currentTime + 0.1;
  scheduleDemo();
  setSource("demo");
}

function stopDemo() { demo.on = false; }

function setSource(s) {
  source = s;
  document.getElementById("srcMic").classList.toggle("on", s === "mic");
  document.getElementById("srcDemo").classList.toggle("on", s === "demo");
  document.getElementById("srcOff").classList.toggle("on", s === "off");
  listeningEl.textContent = s === "mic" ? "listening" : s === "demo" ? "demo playing" : "quiet";
  status.classList.toggle("visible", s !== "off");
}

/* ---- analysis ---- */

let lastOnset = 0;
let lastSpawn = 0;
let lastDominantPc = -1;
let liveLevel = 0, liveFlux = 0;
let fluxHistory = [];
let statusFadeTimer = null;
const smoothChroma = new Float32Array(12);
const spawnTimes = [];

function analyse(now) {
  if (!analyser || source === "off") return;

  analyser.getFloatFrequencyData(freqData);
  analyser.getFloatTimeDomainData(timeData);

  let sum = 0;
  for (let i = 0; i < timeData.length; i += 4) sum += timeData[i] * timeData[i];
  const rms = Math.sqrt(sum / (timeData.length / 4));
  let level = Math.min(1, rms * 9);

  const binW = ac.sampleRate / analyser.fftSize;
  const lo = Math.floor(70 / binW), hi = Math.min(Math.floor(1400 / binW), freqData.length - 1);

  let flux = 0;
  const chroma = new Float32Array(12);
  for (let i = lo; i <= hi; i++) {
    const db = freqData[i];
    const mag = db < -90 ? 0 : Math.pow(10, db / 20);
    const dInc = mag - prevMag[i];
    if (dInc > 0) flux += dInc;
    prevMag[i] = mag;
    if (mag > 0) {
      const f = i * binW;
      const midi = 69 + 12 * Math.log2(f / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      chroma[pc] += mag * mag * (1 / (1 + (f / 500)));
    }
  }

  liveLevel = level;
  liveFlux = flux;

  fluxHistory.push(flux);
  if (fluxHistory.length > 45) fluxHistory.shift();
  const mean = fluxHistory.reduce((a, b) => a + b, 0) / fluxHistory.length;
  const sd = Math.sqrt(fluxHistory.reduce((a, b) => a + (b - mean) ** 2, 0) / fluxHistory.length);
  const gate = 0.015 + (1 - ctl.sens) * 0.05;
  const thresh = mean + sd * (3.2 - ctl.sens * 1.7);

  let max = 0;
  for (let i = 0; i < 12; i++) {
    smoothChroma[i] = smoothChroma[i] * 0.86 + chroma[i] * 0.14;
    if (smoothChroma[i] > max) max = smoothChroma[i];
  }
  const pcs = [];
  if (max > 0) {
    for (let i = 0; i < 12; i++) {
      if (smoothChroma[i] > max * 0.5) pcs.push({ pc: i, w: smoothChroma[i] });
    }
    pcs.sort((a, b) => b.w - a.w);
    pcs.length = Math.min(pcs.length, 2);
  }

  const audible = level > gate;
  const onset = flux > thresh && level > gate * 1.3 && now - lastOnset > 420;
  const dominant = pcs.length ? pcs[0].pc : -1;
  const pcChanged = dominant !== -1 && dominant !== lastDominantPc && audible;
  const sustained = audible && pcs.length > 0 && now - lastSpawn > 5200;

  const minGap = 2400 - ctl.sens * 1200;
  const mayStrike = now - lastSpawn > minGap;
  while (spawnTimes.length && now - spawnTimes[0] > 10000) spawnTimes.shift();
  const calm = spawnTimes.length < 4;

  if (pcs.length &&
      ((onset && now - lastSpawn > 260) ||
       (mayStrike && calm && (pcChanged || sustained)))) {
    spawnTimes.push(now);
    if (sustained && !onset && !pcChanged) level *= 0.55;
    lastOnset = onset ? now : lastOnset;
    lastSpawn = now;
    lastDominantPc = dominant;
    spawnStrike(pcs, level);
    notesEl.textContent = pcs.map(p => NOTE_NAMES[p.pc]).join(" · ");
    document.getElementById("notedot").style.background =
      pigmentColor(pcs[0].pc, 0.9, 0.5);
    document.body.classList.remove("idle");
    clearTimeout(statusFadeTimer);
    statusFadeTimer = setTimeout(() => {
      notesEl.textContent = "";
      document.getElementById("notedot").style.background = "transparent";
      document.body.classList.add("idle");
    }, 2600);
  }
}

// Snapshot of what the room sounds like right now, for external observers
// (agent.js). Read-only; movement/material changes go through setSkin /
// setComposition so the engine stays skin-agnostic.
window.PIGMENT.observe = () => ({
  source,
  level: liveLevel,
  flux: liveFlux,
  chroma: Array.from(smoothChroma),
  dominantPc: lastDominantPc,
  strikesLast10s: spawnTimes.length,
  skin: SKIN ? SKIN.name : null,
  composition: COMPOSITION.id,
});

/* ---------------- main loop ---------------- */

let lastFrame = performance.now();
function frame(now) {
  const raw = (now - lastFrame) / 1000;
  lastFrame = now;
  if (demo.on) scheduleDemo();
  analyse(now);
  stepGestures(now);
  stepSpecialMovements(now, Math.min(raw, 1 / 20));
  stepBlooms(now);
  stepCapillaryVeins(now);
  stepThreads(now);
  let remaining = Math.min(raw, 1.5);
  let simNow = now - remaining * 1000;
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 60);
    simNow += dt * 1000;
    stepDrips(simNow, dt);
    stepFade(dt);
    remaining -= dt;
  }
  stepGloss(now);
  if (recorder && recComp) compositeTo(recComp.getContext("2d"));
  requestAnimationFrame(frame);
}

/* ---------------- ui wiring ---------------- */

const welcome = document.getElementById("welcome");
function dismissWelcome() { welcome.classList.add("gone"); }

document.getElementById("startMic").addEventListener("click", async () => {
  const ok = await startMic();
  dismissWelcome();
  if (!ok) document.body.classList.add("panel-open");
});
document.getElementById("startDemo").addEventListener("click", () => {
  startDemo();
  dismissWelcome();
});
document.getElementById("panelToggle").addEventListener("click", () => {
  document.body.classList.toggle("panel-open");
});
const compositionSelect = document.getElementById("compositionSelect");
for (const composition of COMPOSITIONS) {
  const option = document.createElement("option");
  option.value = composition.id;
  option.textContent = composition.label;
  compositionSelect.appendChild(option);
}
compositionSelect.addEventListener("change", e => setComposition(e.target.value));
document.getElementById("skinSelect").addEventListener("change", e => setSkin(e.target.value));
document.getElementById("srcMic").addEventListener("click", startMic);
document.getElementById("srcDemo").addEventListener("click", startDemo);
document.getElementById("srcOff").addEventListener("click", () => {
  stopMic(); stopDemo(); setSource("off");
});
document.getElementById("btnClear").addEventListener("click", clearPainting);

function compositeTo(o) {
  o.fillStyle = P("paperHex");
  o.fillRect(0, 0, W, H);
  o.globalAlpha = 0.5;
  o.drawImage(grainC, 0, 0);
  o.globalAlpha = 1;
  o.globalCompositeOperation = P("blend") === "screen" ? "screen" : "multiply";
  o.drawImage(paintC, 0, 0);
  o.globalCompositeOperation = "source-over";
  o.drawImage(wetC, 0, 0);
}

function savePainting() {
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  compositeTo(out.getContext("2d"));
  const a = document.createElement("a");
  const d = new Date();
  a.download = `pigment-${SKIN ? SKIN.name : "painting"}-` +
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.png`;
  a.href = out.toDataURL("image/png");
  a.click();
}
document.getElementById("btnSave").addEventListener("click", savePainting);

/* ---- video recording: the painting plus its sound ---- */

let recorder = null, recChunks = [], recComp = null, recDest = null;

function toggleRecord() {
  if (recorder) { recorder.stop(); return; }
  ensureCtx();
  recComp = document.createElement("canvas");
  recComp.width = W; recComp.height = H;
  const stream = recComp.captureStream(30);
  recDest = ac.createMediaStreamDestination();
  analyser.connect(recDest);
  const audio = recDest.stream.getAudioTracks()[0];
  if (audio) stream.addTrack(audio);
  recChunks = [];
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = e => { if (e.data.size) recChunks.push(e.data); };
  recorder.onstop = () => {
    try { analyser.disconnect(recDest); } catch (e) {}
    const blob = new Blob(recChunks, { type: "video/webm" });
    const a = document.createElement("a");
    const d = new Date();
    a.download = `pigment-${SKIN ? SKIN.name : "session"}-` +
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.webm`;
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    recorder = null; recComp = null; recDest = null;
    updateRecUi();
  };
  recorder.start(1000);
  updateRecUi();
}

function updateRecUi() {
  const btn = document.getElementById("btnRecord");
  if (btn) btn.textContent = recorder ? "■ stop recording" : "record video";
  document.body.classList.toggle("recording", !!recorder);
}
document.getElementById("btnRecord").addEventListener("click", toggleRecord);

/* ---- focus mode: nothing but the painting ---- */

let cursorTimer = null;
function toggleFocus() {
  const on = document.body.classList.toggle("focus-mode");
  if (on) {
    document.body.classList.remove("panel-open");
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
document.addEventListener("mousemove", () => {
  if (!document.body.classList.contains("focus-mode")) return;
  document.body.classList.remove("cursor-hidden");
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => document.body.classList.add("cursor-hidden"), 2200);
});

/* ---- keyboard ---- */

document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  const names = Object.keys(SKINS);
  const idx = SKIN ? names.indexOf(SKIN.name) : 0;
  const movements = COMPOSITIONS.map(c => c.id);
  const movementIdx = movements.indexOf(COMPOSITION.id);
  switch (e.key) {
    case "c": clearPainting(); break;
    case "s": savePainting(); break;
    case "r": toggleRecord(); break;
    case "f": toggleFocus(); break;
    case "h": document.body.classList.toggle("panel-open"); break;
    case "[": setSkin(names[(idx - 1 + names.length) % names.length]); break;
    case "]": setSkin(names[(idx + 1) % names.length]); break;
    case "{": setComposition(movements[(movementIdx - 1 + movements.length) % movements.length]); break;
    case "}": setComposition(movements[(movementIdx + 1) % movements.length]); break;
    case "Escape":
      if (document.body.classList.contains("focus-mode")) toggleFocus();
      break;
  }
});

/* ---------------- boot ---------------- */

resize();
requestAnimationFrame(frame);

// activate the remembered (or first-registered) skin as soon as the skin
// scripts have run — DOMContentLoaded, not load, to avoid a light-theme flash
window.addEventListener("DOMContentLoaded", () => {
  let name = null;
  let composition = null;
  try { name = localStorage.getItem("pigment-skin"); } catch (e) {}
  try { composition = localStorage.getItem("pigment-composition"); } catch (e) {}
  if (!name || !SKINS[name]) name = Object.keys(SKINS)[0];
  if (!composition || !COMPOSITION_BY_ID[composition]) composition = COMPOSITIONS[0].id;
  if (name) setSkin(name, { keepPaint: true });
  setComposition(composition, { keepPaint: true });
});

/* debug handle for automated visual testing */
window.PIG = {
  spawnStrike, spawnBloom, blooms, drips, glosses, threads, gestures,
  liquidParticles, sandParticles, woodTips, woodNodes, capillaryVeins, ctl,
  score: () => compositionState.lastScore,
  composition: () => COMPOSITION,
  setComposition,
  clear: clearPainting,
  render(ms) {
    let vnow = performance.now();
    const end = vnow + ms;
    while (vnow < end) {
      vnow += 1000 / 60;
      stepGestures(vnow);
      stepSpecialMovements(vnow, 1 / 60);
      stepBlooms(vnow);
      stepCapillaryVeins(vnow);
      stepThreads(vnow);
      stepDrips(vnow, 1 / 60);
      stepFade(1 / 60);
    }
    stepGloss(performance.now());
  },
  movementStats() {
    return {
      id: COMPOSITION.id,
      gestures: gestures.length,
      liquid: liquidParticles.length,
      sand: sandParticles.length,
      woodTips: woodTips.length,
      woodNodes: woodNodes.length,
    };
  },
  materialStats() {
    return {
      id: SKIN ? SKIN.name : null,
      capillaries: capillaryVeins.length,
      glosses: glosses.length,
    };
  },
  async playUrl(url, volume = 0.35) {
    ensureCtx();
    stopMic(); stopDemo();
    const buf = await fetch(url).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b));
    if (this._fileSrc) { try { this._fileSrc.stop(); } catch (e) {} }
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.connect(analyser);
    const out = ac.createGain();
    out.gain.value = volume;
    s.connect(out); out.connect(ac.destination);
    s.start();
    this._fileSrc = s;
    setSource("demo");
    listeningEl.textContent = "playing file";
    return buf.duration;
  },
  listen(ms) {
    const end = performance.now() + ms;
    let spawns = 0;
    const before = () => blooms.length + drips.length;
    while (performance.now() < end) {
      if (demo.on) scheduleDemo();
      const now = performance.now();
      const n0 = before();
      analyse(now);
      if (before() > n0) spawns++;
      stepGestures(now);
      stepSpecialMovements(now, 1 / 30);
      stepBlooms(now);
      stepCapillaryVeins(now);
      stepThreads(now);
      stepDrips(now, 1 / 30);
      const until = now + 33;
      while (performance.now() < until) { /* busy-wait */ }
    }
    return spawns;
  },
};
