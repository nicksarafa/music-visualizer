/* the flock — the skin that dreams every other dream.
   Finale of the 2026-07-23 conductor residency: its sketch discovers
   every other living skin at runtime, compiles their sketches, and
   cycles through them in slow shifts — each dream keeping its own
   memory and resuming where it left off, with a crossfade as one
   dream hands the canvas to the next. Add a new living skin to the
   app and the flock learns it automatically. */

PIGMENT.registerSkin({
  name: "the flock",
  vars: {
    "--paper": "oklch(0.16 0.025 280)",
    "--paper-deep": "oklch(0.11 0.025 285)",
    "--ink": "oklch(0.9 0.02 290)",
    "--ink-soft": "oklch(0.62 0.025 285)",
    "--hairline": "oklch(0.27 0.026 282)",
    "--panel-bg": "oklch(0.155 0.025 281 / 0.9)",
    "--bg": `radial-gradient(130% 60% at 50% -15%, oklch(0.22 0.04 290 / 0.7), transparent 55%),
             radial-gradient(150% 130% at 50% 45%, oklch(0.155 0.025 281) 40%, oklch(0.09 0.024 288) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#131022",
    layerCount: [12, 10],
    layerAlphaBase: 0.026,
    layerAlphaVar: 0.018,
    deformInit: 0.12,
    stretch: [1.15, 0.35],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0.12,
    splat: 0.2,
    dripAlpha: 0.04,
    dripWidthMul: 0.6,
    threadAlpha: 0.18,
    causticAlpha: 0.15,
    gravity: 0.3,
    grain: { base: 246, spread: 8, warm: false, alpha: 8, density: 0.03 },
  },
  sketch: `
  // discover and compile every other living skin once
  if (!this.dreams) {
    this.dreams = [];
    this.stores = {};
    this.clocks = {};
    for (const name of Object.keys(PIGMENT.SKINS)) {
      if (name === "the flock") continue;
      const s = PIGMENT.SKINS[name];
      if (typeof s.sketch !== "string") continue;
      try {
        this.dreams.push({ name, fn: new Function("ctx", "w", "h", "t", "audio", "color", '"use strict";' + s.sketch) });
        this.stores[name] = {};
        this.clocks[name] = 0;
      } catch (e) {}
    }
  }
  if (!this.dreams.length) return;
  const PHASE = 25, FADE = 3;
  // the flock dreams what the room asks for
  const byName = {};
  for (let i = 0; i < this.dreams.length; i++) byName[this.dreams[i].name] = i;
  const chooseNext = () => {
    const alive = (this.mood_glow || []).filter(g => g > 0.1).length;
    const pick = names => {
      const have = names.filter(n => byName[n] != null && byName[n] !== this.curIdx);
      return have.length ? byName[have[(Math.random() * have.length) | 0]] : null;
    };
    let n = null;
    if (audio.strikesLast10s >= 8 || audio.level > 0.5) n = pick(["storm glass", "electric sheep"]);
    else if (audio.level < 0.08) n = pick(["shan shui memory", "lantern pond"]);
    else if (alive >= 4) n = pick(["pendulum choir", "twin nebula"]);
    if (n == null) n = (this.curIdx + 1 + ((Math.random() * (this.dreams.length - 1)) | 0)) % this.dreams.length;
    return n;
  };
  this.mood_glow = this.mood_glow || new Array(12).fill(0);
  let mmx = 0;
  for (let i = 0; i < 12; i++) mmx = Math.max(mmx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const tg = mmx > 0 ? audio.chroma[i] / mmx : 0;
    this.mood_glow[i] += (tg - this.mood_glow[i]) * 0.05;
  }
  if (this.curIdx == null) { this.curIdx = 0; this.nxtIdx = chooseNext(); this.phaseStart = t; }
  let pt = t - this.phaseStart;
  if (pt >= PHASE) { this.curIdx = this.nxtIdx; this.nxtIdx = chooseNext(); this.phaseStart = t; pt = 0; }
  const cur = this.dreams[this.curIdx];
  const nxt = this.dreams[this.nxtIdx];
  // ink dreams were born on light paper — raise a screen for them
  const LIGHT = { "shan shui memory": 1, "pendulum choir": 1 };
  let screen = LIGHT[cur.name] ? 1 : 0;
  if (pt > PHASE - FADE) {
    const a = (pt - (PHASE - FADE)) / FADE;
    screen = screen * (1 - a) + (LIGHT[nxt.name] ? 1 : 0) * a;
  }
  if (screen > 0.02) {
    const g = ctx.createRadialGradient(w / 2, h * 0.52, 0, w / 2, h * 0.52, Math.max(w, h) * 0.62);
    g.addColorStop(0, "rgba(240,237,226," + (0.62 * screen).toFixed(3) + ")");
    g.addColorStop(1, "rgba(240,237,226," + (0.28 * screen).toFixed(3) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // each dream's clock only runs while it is dreaming
  this.clocks[cur.name] += 1 / 60;
  try {
    cur.fn.call(this.stores[cur.name], ctx, w, h, this.clocks[cur.name], audio, color);
  } catch (e) {}
  if (pt > PHASE - FADE && nxt !== cur) {
    this.clocks[nxt.name] += 1 / 60;
    const a = (pt - (PHASE - FADE)) / FADE;
    ctx.save();
    ctx.globalAlpha = a * 0.8;
    try {
      nxt.fn.call(this.stores[nxt.name], ctx, w, h, this.clocks[nxt.name], audio, color);
    } catch (e) {}
    ctx.restore();
  }
  // the flock announces which dream is passing through
  const pc0 = audio.dominantPc >= 0 ? audio.dominantPc : 0;
  ctx.fillStyle = color(pc0, 0.35, 0.8, 0.1);
  ctx.font = "italic " + (12 * (w / 1400)) + "px Georgia";
  ctx.textAlign = "left";
  ctx.fillText("the flock is dreaming: " + cur.name, 20, h - 16);`,
});
