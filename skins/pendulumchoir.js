/* pendulum choir — intervals drawn as harmonograph figures.
   Born live in the 2026-07-23 conductor residency: every audible note
   swings a pendulum whose frequency ratio is its true interval against
   the dominant. Consonance traces closed rosettes; dissonance weaves
   restless nets; each key change makes the choir take a breath and
   re-seed. Interval names are captioned as they sound. A living skin —
   the choir swings whenever this paint is selected. */

PIGMENT.registerSkin({
  name: "pendulum choir",
  vars: {
    "--paper": "oklch(0.955 0.008 240)",
    "--paper-deep": "oklch(0.92 0.012 240)",
    "--ink": "oklch(0.32 0.02 255)",
    "--ink-soft": "oklch(0.54 0.018 252)",
    "--hairline": "oklch(0.85 0.012 242)",
    "--panel-bg": "oklch(0.955 0.008 240 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.975 0.006 240 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.952 0.009 240) 55%, oklch(0.91 0.014 244) 100%)`,
  },
  params: {
    paperHex: "#eef0f4",
    layerCount: [10, 8],
    layerAlphaBase: 0.03,
    layerAlphaVar: 0.02,
    deformInit: 0.08,
    deformDepth: 3,
    stretch: [1.1, 0.25],
    sizeMul: 0.6,
    granulate: false,
    edgeAlpha: 0.04,
    glossAlpha: 0,
    dripAlpha: 0.02,
    dripWidthMul: 0.5,
    threadAlpha: 0.18,
    gravity: 0.25,
    grain: { base: 238, spread: 10, warm: false, alpha: 6, density: 0.3 },
  },
  sketch: `
  this.glow = this.glow || new Array(12).fill(0);
  this.figs = this.figs || {};
  this.lastDom = this.lastDom == null ? -1 : this.lastDom;
  let mx = 0;
  for (let i = 0; i < 12; i++) mx = Math.max(mx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const tg = mx > 0 ? audio.chroma[i] / mx : 0;
    this.glow[i] += (tg - this.glow[i]) * 0.05;
  }
  const dom = audio.dominantPc >= 0 ? audio.dominantPc : this.lastDom >= 0 ? this.lastDom : 0;
  if (dom !== this.lastDom) {
    this.lastDom = dom;
    for (const k in this.figs) this.figs[k].ph = Math.random() * 6.28;
  }
  const cx = w / 2, cy = h / 2, S = Math.min(w, h) * 0.36;
  const tops = this.glow.map((g, i) => [i, g]).filter(x => x[1] > 0.08)
    .sort((a, b) => b[1] - a[1]).slice(0, 4);
  for (const [pc, g] of tops) {
    if (!this.figs[pc]) this.figs[pc] = { ph: Math.random() * 6.28, prog: 0 };
    const f = this.figs[pc];
    f.prog += 0.9 + audio.level * 1.6;
    const semis = ((pc - dom) + 12) % 12;
    const ratio = Math.pow(2, semis / 12);
    const damp = 0.9985;
    const size = S * (0.45 + g * 0.65);
    ctx.strokeStyle = color(pc, 0.16 + g * 0.35 + audio.level * 0.15, 0.62, 0.13);
    ctx.lineWidth = 1.8 + g * 3.5;
    ctx.beginPath();
    const N = 240;
    for (let s = 0; s < N; s++) {
      const u = (f.prog - N + s) * 0.035;
      if (u < 0) continue;
      const decay = Math.pow(damp, s * 2);
      const x = cx + Math.sin(u + f.ph) * size * decay
              + Math.sin(u * 0.31 + f.ph * 2) * size * 0.12;
      const y = cy + Math.sin(u * ratio + f.ph * 0.6) * size * 0.82 * decay
              + Math.cos(u * 0.27) * size * 0.1;
      if (s === 0 || u === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const u0 = f.prog * 0.035;
    const px = cx + Math.sin(u0 + f.ph) * size + Math.sin(u0 * 0.31 + f.ph * 2) * size * 0.12;
    const py = cy + Math.sin(u0 * ratio + f.ph * 0.6) * size * 0.82 + Math.cos(u0 * 0.27) * size * 0.1;
    ctx.fillStyle = color(pc, 0.4 + g * 0.3, 0.75, 0.11);
    ctx.beginPath(); ctx.arc(px, py, 2.5 + g * 4 + audio.level * 3, 0, Math.PI * 2); ctx.fill();
  }
  const names = ['unison','m2','M2','m3','M3','P4','tritone','P5','m6','M6','m7','M7'];
  ctx.fillStyle = color(dom, 0.35, 0.5, 0.12);
  ctx.font = (11 * (w / 1400)) + 'px Georgia';
  ctx.textAlign = 'right';
  const iv = tops.filter(x => x[0] !== dom).map(x => names[((x[0] - dom) + 12) % 12]).join(' · ');
  ctx.fillText('pendulum choir · ' + (iv || 'unison'), w - 20, h - 16);`,
});
