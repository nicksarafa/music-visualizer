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
  placement: "scatter",     // "scatter" | "orbit" (spiral arm around center)
  leanMode: "flow",         // "flow" | "vertical" (curtains)
  gravity: 1,               // drip direction/speed; negative = paint rises
  ringed: false,            // stroke floating rings instead of filled washes
  splat: 0,                 // 0..1: tiny droplets flung past the bloom's edge
  grain: { base: 235, spread: 20, warm: true, alpha: 10, density: 0.5, light: false },
};

function P(key) { return (SKIN && SKIN.params && key in SKIN.params) ? SKIN.params[key] : DEFAULT_PARAMS[key]; }

// a painted swatch preview for the gallery: paper, three strokes of the
// skin's palette, one drip
function paintSwatch(canvas, skin) {
  const g = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const p = key => (skin.params && key in skin.params) ? skin.params[key] : DEFAULT_PARAMS[key];
  g.fillStyle = p("paperHex");
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = p("blend") === "screen" ? "screen" : "multiply";
  const col = skin.color || defaultColor;
  const swatchPcs = [0, 7, 9];   // C, G, A — a familiar family
  swatchPcs.forEach((pc, i) => {
    const cx = w * (0.22 + i * 0.28) + Math.sin(i * 7 + 1) * 3;
    const cy = h * (0.4 + Math.sin(i * 5) * 0.12);
    const r = h * 0.22;
    for (let k = 0; k < 7; k++) {
      g.fillStyle = col(pc, 0.11, i * 3.7 + k, 1, 0);
      g.beginPath();
      g.ellipse(cx + Math.sin(k * 9 + i) * 2, cy + Math.cos(k * 5) * 1.6,
                r * (0.5 + k * 0.09) * 1.2, r * (0.5 + k * 0.09) * 0.88,
                i - k * 0.1, 0, Math.PI * 2);
      p("ringed") ? (g.strokeStyle = g.fillStyle, g.lineWidth = 1, g.stroke()) : g.fill();
    }
    if (i === 1) {
      g.strokeStyle = col(pc, 0.3, 2, 1, 0);
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(cx, cy + r * 0.5);
      g.quadraticCurveTo(cx + 2, cy + r * 1.4, cx - 1, h * 0.92);
      g.stroke();
    }
  });
}

function registerSkin(skin) {
  SKINS[skin.name] = skin;
  const gal = document.getElementById("skinGallery");
  if (gal && !gal.querySelector(`[data-skin="${skin.name}"]`)) {
    const btn = document.createElement("button");
    btn.className = "swatch";
    btn.dataset.skin = skin.name;
    btn.title = skin.name;
    const cv = document.createElement("canvas");
    cv.width = 104; cv.height = 56;
    paintSwatch(cv, skin);
    const label = document.createElement("span");
    label.textContent = skin.name;
    btn.appendChild(cv);
    btn.appendChild(label);
    btn.addEventListener("click", () => setSkin(skin.name));
    gal.appendChild(btn);
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
  document.querySelectorAll("#skinGallery .swatch").forEach(b =>
    b.classList.toggle("on", b.dataset.skin === name));
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

window.PIGMENT = { registerSkin, setSkin, SKINS, helpers: { pcHue: (...a) => pcHue(...a), gauss: (...a) => gauss(...a) } };

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
  threads.length = 0; recentPoints.length = 0;
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

/* ---------------- paint world ---------------- */

const blooms = [];
const drips = [];
const glosses = [];
const threads = [];
const recentPoints = [];
const flow = { a: 0 };

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

  let x = 0, y = 0;
  const minD = Math.min(W, H);
  if (P("placement") === "orbit") {
    // strikes ride a slowly turning spiral arm around the center
    flow.orbitA = (flow.orbitA || 0) + 0.55 + Math.random() * 0.25;
    const turns = (flow.orbitA % (Math.PI * 5.2)) / (Math.PI * 5.2);
    const rad = minD * (0.08 + turns * 0.42);
    x = W * 0.5 + Math.cos(flow.orbitA) * rad * (W / H > 1.4 ? 1.25 : 1)
      + gauss() * minD * 0.03;
    y = H * 0.5 + Math.sin(flow.orbitA) * rad + gauss() * minD * 0.03;
    x = Math.max(W * 0.05, Math.min(W * 0.95, x));
    y = Math.max(H * 0.05, Math.min(H * 0.95, y));
    flow.a = flow.orbitA + Math.PI / 2 + gauss() * 0.2;
  } else {
    const recent = recentPoints.slice(-6);
    for (let attempt = 0; attempt < 5; attempt++) {
      x = W * (0.07 + Math.random() * 0.86);
      y = H * (0.07 + Math.random() * 0.86);
      if (recent.every(p => Math.hypot(p.x - x, p.y - y) > minD * 0.27)) break;
    }
    const prev = recentPoints[recentPoints.length - 1];
    flow.a = prev ? Math.atan2(y - prev.y, x - prev.x) + gauss() * 0.4
                  : Math.random() * Math.PI * 2;
  }
  if (P("leanMode") === "vertical") flow.a = Math.PI / 2 + gauss() * 0.12;
  spawnThreads(x, y, pcs[0].pc);
  rememberPoint(x, y, pcs[0].pc);

  const sizeBase = (0.03 + ctl.size * 0.065) * minD * (0.72 + Math.random() * 0.6) * P("sizeMul");
  const total = pcs.reduce((s, p) => s + p.w, 0) || 1;

  pcs.forEach((p, i) => {
    const share = p.w / total;
    const r = sizeBase * (i === 0 ? 0.95 : 0.4 + share * 0.45) * (0.75 + level * 0.5);
    const a = Math.random() * Math.PI * 2;
    const d = i === 0 ? 0 : sizeBase * (0.5 + Math.random() * 0.35);
    spawnBloom(x + Math.cos(a) * d, y + Math.sin(a) * d, r, p.pc, level, i * 80, quality);
  });
}

function spawnBloom(x, y, r, pc, level, delay, quality = 1) {
  const seed = Math.random();
  const [stMin, stVar] = P("stretch");
  const stretch = stMin + Math.random() * stVar;
  const ca = Math.cos(flow.a), sa = Math.sin(flow.a);
  const poly = deform(basePolygon(r), r * P("deformInit"), P("deformDepth")).map(p => {
    const ex = p.x * stretch, ey = p.y * (0.82 + Math.random() * 0.06);
    return { x: ex * ca - ey * sa, y: ex * sa + ey * ca, v: p.v };
  });
  const [lBase, lVar] = P("layerCount");
  const layers = Math.round(lBase + ctl.bleed * lVar);
  const bloom = {
    x, y, r, pc, seed, poly, layers, quality,
    driftA: Math.random() * Math.PI * 2,
    edgeSoft: 0.7 + Math.random() * 0.6,
    aMul: Math.min(1.5, Math.max(1, 1.6 - r / (Math.min(W, H) * 0.07))),
    born: performance.now() + delay,
    life: 1400 + ctl.bleed * 900,
    drawn: 0,
  };
  blooms.push(bloom);
  if (delay === 0) drawBloomLayers(bloom, Math.ceil(layers * 0.34));
  const splat = P("splat");
  if (splat > 0) {
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
  if (P("glossAlpha") > 0) {
    glosses.push({ x, y, r: r * 0.8, born: performance.now() + delay, life: 7000 });
  }
  if (ctl.drip > 0.15 && Math.random() < 0.28 + ctl.drip * 0.35) {
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
    if (P("ringed")) {
      // suminagashi: concentric floating rings instead of filled washes
      pctx.strokeStyle = pigmentColor(b.pc, Math.min(1, alpha * 2.4), b.seed + b.drawn, b.quality, hueOff);
      pctx.lineWidth = (0.8 + Math.random() * 1.3) * DPR;
      tracePoly(pctx, variant, b.x + dx, b.y + dy, s);
      pctx.stroke();
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
      if (P("granulate")) granulate(b);
      if (P("edgeAlpha") > 0) {
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

/* ---------------- main loop ---------------- */

let lastFrame = performance.now();
function frame(now) {
  const raw = (now - lastFrame) / 1000;
  lastFrame = now;
  if (demo.on) scheduleDemo();
  analyse(now);
  stepBlooms(now);
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
  switch (e.key) {
    case "c": clearPainting(); break;
    case "s": savePainting(); break;
    case "r": toggleRecord(); break;
    case "f": toggleFocus(); break;
    case "h": document.body.classList.toggle("panel-open"); break;
    case "[": setSkin(names[(idx - 1 + names.length) % names.length]); break;
    case "]": setSkin(names[(idx + 1) % names.length]); break;
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
  try { name = localStorage.getItem("pigment-skin"); } catch (e) {}
  if (!name || !SKINS[name]) name = Object.keys(SKINS)[0];
  if (name) setSkin(name, { keepPaint: true });
});

/* debug handle for automated visual testing */
window.PIG = {
  spawnStrike, spawnBloom, blooms, drips, glosses, threads, ctl,
  clear: clearPainting,
  render(ms) {
    let vnow = performance.now();
    const end = vnow + ms;
    while (vnow < end) {
      vnow += 1000 / 60;
      stepBlooms(vnow);
      stepThreads(vnow);
      stepDrips(vnow, 1 / 60);
      stepFade(1 / 60);
    }
    stepGloss(performance.now());
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
      stepBlooms(now);
      stepThreads(now);
      stepDrips(now, 1 / 30);
      const until = now + 33;
      while (performance.now() < until) { /* busy-wait */ }
    }
    return spawns;
  },
};
