"use strict";

/* ================================================================
   pigment — live set, 2026-07-23
   A performance conducted by hand: each act is a complete conductor
   decision (movement + material + real-time sketch) that was played
   live against a hot microphone. Replay any act from the console:

     LIVESET.play(0)        // act number
     LIVESET.acts           // browse the set list

   Load by pasting into the console, or add a script tag after
   agent.js. Requires the conductor runtime (window.CONDUCTOR).
   ================================================================ */

window.LIVESET = { acts: [], play(n) { CONDUCTOR.applyDecision(this.acts[n]); } };

/* ---- act i — murmuration ----------------------------------------
   The room opened loud, so the set opens with a flock: 140 birds
   whose cohesion and speed follow loudness, trailing the dominant
   pitch color, with wing-glints on the second-strongest note. */
window.LIVESET.acts.push({
  comment: "act i — murmuration over the grove",
  movement: "vitruvian-grove",
  base_paint: "cyanotype",
  params: { sizeMul: 1.3, gravity: 0.8, splat: 0.4, capillary: 0.3, glossAlpha: 0.1,
    edgeAlpha: 0.08, dripAlpha: 0.05, dripWidthMul: 1, threadAlpha: 0.5, stippleDensity: 1,
    interferenceAlpha: 0, causticAlpha: 0.15, leafAlpha: 0, strokeMode: "wash",
    leanMode: "flow", granulate: true, ringed: false },
  sketch_mode: "replace",
  sketch: `
  this.birds = this.birds || Array.from({length: 140}, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4
  }));
  const cx = w / 2, cy = h / 2;
  const pull = 0.0006 + audio.level * 0.004;
  const jitter = 0.6 + Math.min(2.5, audio.flux * 30);
  const pc = audio.dominantPc >= 0 ? audio.dominantPc : 9;
  for (const b of this.birds) {
    b.vx += (cx - b.x) * pull + (Math.random() - 0.5) * jitter;
    b.vy += (cy - b.y) * pull * 1.15 + (Math.random() - 0.5) * jitter;
    const sp = Math.hypot(b.vx, b.vy), max = 3.5 + audio.level * 9;
    if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
    b.x += b.vx; b.y += b.vy;
    ctx.strokeStyle = color(pc, 0.10 + audio.level * 0.35, 0.55, 0.11);
    ctx.lineWidth = 1.1 * (1 + audio.level);
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 2.4, b.y - b.vy * 2.4);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  let second = -1, best = 0;
  for (let i = 0; i < 12; i++) if (i !== pc && audio.chroma[i] > best) { best = audio.chroma[i]; second = i; }
  if (second >= 0 && audio.level > 0.15) {
    for (let g = 0; g < 6; g++) {
      const b = this.birds[(Math.random() * this.birds.length) | 0];
      ctx.fillStyle = color(second, 0.5, 0.8, 0.09);
      ctx.beginPath(); ctx.arc(b.x, b.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }`,
});

/* ---- act ii — solar chorus ---------------------------------------
   The room held at full loudness with high flux, so the set escalated:
   the chromagram itself becomes a rotating sun — twelve spokes on the
   circle of fifths, each spoke's reach following its note's live
   energy, a molten core breathing on loudness, embers flung on flux
   that arc and fall home. Played over embers/impasto, radiant-heart. */
window.LIVESET.acts.push({
  comment: "act ii — solar chorus, the room is blazing",
  movement: "radiant-heart",
  base_paint: "embers",
  params: { sizeMul: 1.6, gravity: 1.2, splat: 0.8, capillary: 0.15, glossAlpha: 0.25,
    edgeAlpha: 0.12, dripAlpha: 0.07, dripWidthMul: 1.4, threadAlpha: 0.25, stippleDensity: 1.4,
    interferenceAlpha: 0, causticAlpha: 0.45, leafAlpha: 0.2, strokeMode: "impasto",
    leanMode: "flow", granulate: true, ringed: false },
  sketch_mode: "replace",
  sketch: `
  this.rot = (this.rot || 0) + 0.0015 + audio.level * 0.006;
  this.smooth = this.smooth || new Array(12).fill(0);
  this.embers = this.embers || [];
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
  let max = 0;
  for (let i = 0; i < 12; i++) max = Math.max(max, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const target = max > 0 ? audio.chroma[i] / max : 0;
    this.smooth[i] += (target - this.smooth[i]) * 0.06;
  }
  for (let i = 0; i < 12; i++) {
    const a = this.rot + i * Math.PI / 6;
    const len = R * (0.12 + this.smooth[i] * 0.88);
    const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.addColorStop(0, color(i, 0, 0.75, 0.14));
    g.addColorStop(0.6, color(i, 0.20 + this.smooth[i] * 0.30, 0.72, 0.15));
    g.addColorStop(1, color(i, 0, 0.8, 0.1));
    ctx.strokeStyle = g;
    ctx.lineWidth = (3 + this.smooth[i] * 16) * (0.7 + audio.level * 0.6);
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.06, cy + Math.sin(a) * R * 0.06);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
  }
  const core = R * (0.045 + audio.level * 0.07);
  const pc = audio.dominantPc >= 0 ? audio.dominantPc : 2;
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, core * 2.4);
  cg.addColorStop(0, color(pc, 0.55, 0.9, 0.07));
  cg.addColorStop(0.5, color(pc, 0.22, 0.75, 0.13));
  cg.addColorStop(1, color(pc, 0, 0.7, 0.13));
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(cx, cy, core * 2.4, 0, Math.PI * 2); ctx.fill();
  if (audio.flux > 0.05 && this.embers.length < 220) {
    for (let e = 0; e < Math.min(8, audio.flux * 20); e++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5 * (1 + audio.level);
      this.embers.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        pc: (pc + [0, 7, 4][e % 3]) % 12, life: 1 });
    }
  }
  for (let i = this.embers.length - 1; i >= 0; i--) {
    const e = this.embers[i];
    e.x += e.vx; e.y += e.vy; e.vy += 0.02; e.life -= 0.008;
    if (e.life <= 0) { this.embers.splice(i, 1); continue; }
    ctx.fillStyle = color(e.pc, e.life * 0.45, 0.78, 0.12);
    ctx.beginPath(); ctx.arc(e.x, e.y, 1.2 + e.life * 2.2, 0, Math.PI * 2); ctx.fill();
  }`,
});

/* ---- act iii — bioluminescent tide -------------------------------
   The room exhaled — loudness fell to 0.3, flux near zero, a close
   chromatic cluster around C#/D. The set followed it down: lantern
   motes adrift on slow currents, each pulsing only while its note is
   alive in the room, joined by faint filaments when they pass close.
   Played over suminagashi/nacre with deep capillaries, color-tide. */
window.LIVESET.acts.push({
  comment: "act iii — bioluminescent tide, the room exhales",
  movement: "color-tide",
  base_paint: "suminagashi",
  params: { sizeMul: 0.9, gravity: 0.2, splat: 0.05, capillary: 0.7, glossAlpha: 0.18,
    edgeAlpha: 0.05, dripAlpha: 0.02, dripWidthMul: 0.7, threadAlpha: 0.15, stippleDensity: 0.8,
    interferenceAlpha: 0.35, causticAlpha: 0.1, leafAlpha: 0, strokeMode: "nacre",
    leanMode: "flow", granulate: false, ringed: false },
  sketch_mode: "replace",
  sketch: `
  this.lan = this.lan || Array.from({length: 64}, (_, i) => ({
    x: Math.random() * w, y: Math.random() * h,
    ph: Math.random() * Math.PI * 2, dp: 0.008 + Math.random() * 0.02,
    dr: Math.random() * Math.PI * 2, pc: i % 12
  }));
  this.glow = this.glow || new Array(12).fill(0);
  let mx = 0;
  for (let i = 0; i < 12; i++) mx = Math.max(mx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const target = mx > 0 ? audio.chroma[i] / mx : 0;
    this.glow[i] += (target - this.glow[i]) * 0.04;
  }
  const drift = 0.15 + audio.level * 0.9;
  for (const l of this.lan) {
    l.ph += l.dp;
    l.dr += (Math.random() - 0.5) * 0.05;
    l.x += Math.cos(l.dr) * drift + Math.sin(t * 0.1 + l.ph) * 0.3;
    l.y += Math.sin(l.dr) * drift * 0.6 - 0.08;
    if (l.x < -20) l.x = w + 20; if (l.x > w + 20) l.x = -20;
    if (l.y < -20) l.y = h + 20; if (l.y > h + 20) l.y = -20;
    const g = this.glow[l.pc];
    if (g < 0.03) continue;
    const breath = 0.5 + 0.5 * Math.sin(l.ph * 3 + t);
    const r = (2.5 + g * 9) * (0.7 + breath * 0.6) * (1 + audio.level * 1.5);
    const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r * 3);
    grad.addColorStop(0, color(l.pc, 0.30 * g + 0.06, 0.8, 0.1));
    grad.addColorStop(0.4, color(l.pc, 0.10 * g, 0.7, 0.13));
    grad.addColorStop(1, color(l.pc, 0, 0.65, 0.13));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(l.x, l.y, r * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineWidth = 0.7;
  for (let i = 0; i < this.lan.length; i += 2) {
    const a = this.lan[i];
    if (this.glow[a.pc] < 0.1) continue;
    for (let j = i + 1; j < Math.min(i + 8, this.lan.length); j++) {
      const b = this.lan[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130 && this.glow[b.pc] > 0.1) {
        ctx.strokeStyle = color(a.pc, 0.05 + audio.level * 0.08, 0.75, 0.08);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }`,
});

/* ---- act iv — aurora vespers (finale) ----------------------------
   The room settled to a hush, so the set resolves rather than peaks:
   three woven aurora curtains breathe across the upper sky, their
   strand hues drawn from whichever notes are still alive, and every
   strike that still lands becomes one falling star. Gravity goes
   slightly negative so the paint rises like incense. slow-orbit,
   aurora/airbrush — the patient galaxy closes the show. */
window.LIVESET.acts.push({
  comment: "act iv — aurora vespers, paint rising like incense",
  movement: "slow-orbit",
  base_paint: "aurora",
  params: { sizeMul: 1.0, gravity: -0.6, splat: 0, capillary: 0.4, glossAlpha: 0.15,
    edgeAlpha: 0.04, dripAlpha: 0.03, dripWidthMul: 0.8, threadAlpha: 0.2, stippleDensity: 0.8,
    interferenceAlpha: 0.25, causticAlpha: 0.2, leafAlpha: 0, strokeMode: "airbrush",
    leanMode: "flow", granulate: false, ringed: false },
  sketch_mode: "replace",
  sketch: `
  this.glow = this.glow || new Array(12).fill(0);
  this.meteors = this.meteors || [];
  this.lastStrikes = this.lastStrikes == null ? audio.strikesLast10s : this.lastStrikes;
  let mx = 0;
  for (let i = 0; i < 12; i++) mx = Math.max(mx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const target = mx > 0 ? audio.chroma[i] / mx : 0;
    this.glow[i] += (target - this.glow[i]) * 0.03;
  }
  const alive = this.glow.map((g, i) => [i, g]).filter(x => x[1] > 0.08).sort((a, b) => b[1] - a[1]);
  const pcs = alive.length ? alive.map(x => x[0]) : [1, 8, 3];
  const breathe = 0.6 + 0.4 * Math.sin(t * 0.35) + audio.level * 0.9;
  for (let band = 0; band < 3; band++) {
    const baseY = h * (0.16 + band * 0.10);
    const amp = h * (0.05 + band * 0.02);
    const step = 14;
    for (let x = 0; x <= w; x += step) {
      const ph = x * 0.004 + t * (0.14 + band * 0.05) + band * 2.1;
      const y = baseY + Math.sin(ph) * amp + Math.sin(ph * 0.37 + t * 0.08) * amp * 0.7;
      const len = h * (0.10 + 0.10 * (0.5 + 0.5 * Math.sin(ph * 1.7))) * breathe;
      const pc = pcs[((x / step) | 0) % pcs.length];
      const a = (0.028 + this.glow[pc] * 0.05) * breathe;
      const g = ctx.createLinearGradient(x, y, x, y + len);
      g.addColorStop(0, color(pc, a * 1.6, 0.8, 0.1));
      g.addColorStop(0.55, color(pc, a, 0.72, 0.12));
      g.addColorStop(1, color(pc, 0, 0.7, 0.12));
      ctx.strokeStyle = g;
      ctx.lineWidth = step * 0.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    }
  }
  if (audio.strikesLast10s > this.lastStrikes) {
    this.meteors.push({ x: w * (0.15 + Math.random() * 0.7), y: h * 0.08,
      vx: 1.5 + Math.random() * 2, vy: 2.5 + Math.random() * 2,
      pc: audio.dominantPc >= 0 ? audio.dominantPc : pcs[0], life: 1 });
  }
  this.lastStrikes = audio.strikesLast10s;
  for (let i = this.meteors.length - 1; i >= 0; i--) {
    const m = this.meteors[i];
    m.x += m.vx; m.y += m.vy; m.life -= 0.006;
    if (m.life <= 0 || m.y > h) { this.meteors.splice(i, 1); continue; }
    const tail = 26 * m.life;
    const g = ctx.createLinearGradient(m.x - m.vx * tail, m.y - m.vy * tail, m.x, m.y);
    g.addColorStop(0, color(m.pc, 0, 0.85, 0.08));
    g.addColorStop(1, color(m.pc, 0.5 * m.life, 0.88, 0.08));
    ctx.strokeStyle = g; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(m.x - m.vx * tail, m.y - m.vy * tail); ctx.lineTo(m.x, m.y); ctx.stroke();
  }`,
});

/* ---- act v — moonrise (residency, 14:15) -------------------------
   The hour-long residency begins: the vesper curtains stay, a moon
   climbs for ten minutes over a chroma-twinkling starfield, and every
   strike rings its halo like a bell. Sketch-only evolution — material
   and movement unchanged so the transition is seamless on screen.
   (Sketch body lives in the transcript; replay via acts[3] + moon.) */

/* ---- act vi / vi·b — firefly rose (residency, 14:17–14:24) -------
   The page had been reloaded mid-residency (which wiped the runtime
   act and prompted the persistence fix), and the room had repainted
   itself in embers/orphic-rose autumn. The act respects that scene:
   a five-petal halo rose turning at the center, petals voiced by the
   three strongest notes in the room; 90 fireflies whose blink surges
   with loudness; sparks rising on flux. vi·b adds creeping tendrils
   that grow only while the room sounds — and only while someone is
   watching, since the browser pauses hidden tabs. Sketch-only. */

/* ---- act vii — moth lantern (residency, 14:30) -------------------
   Heard via PIG.listen (throttle-proof) while the tab was hidden:
   the harmony walked down into a chromatic B/C/C# cluster, quiet and
   tense. The rose folds into a single lantern whose flame flickers
   on flux; the fireflies become moths that spiral inward as the
   chromatic tension rises and drift out when it rests; autumn leaves
   fall through the field, faster while the room speaks. */
