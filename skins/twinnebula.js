/* twin nebula — one genome, two dreams, breathing in counterphase.
   Born live in the 2026-07-23 conductor residency at generation 32:
   a fractal-flame genome rendered as two mirrored dust-nebulae that
   meet at a luminous waist, bridged by filaments whenever the same
   note burns in both. Strikes mutate the shared genome; both twins
   transform together. A living skin — the nebulae dream whenever this
   paint is selected. */

PIGMENT.registerSkin({
  name: "twin nebula",
  vars: {
    "--paper": "oklch(0.2 0.035 235)",
    "--paper-deep": "oklch(0.14 0.035 245)",
    "--ink": "oklch(0.9 0.02 220)",
    "--ink-soft": "oklch(0.64 0.028 230)",
    "--hairline": "oklch(0.32 0.032 238)",
    "--panel-bg": "oklch(0.19 0.035 236 / 0.9)",
    "--bg": `radial-gradient(70% 90% at 28% 50%, oklch(0.26 0.05 250 / 0.55), transparent 60%),
             radial-gradient(70% 90% at 72% 50%, oklch(0.26 0.05 220 / 0.55), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.19 0.035 236) 40%, oklch(0.11 0.032 248) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#101c28",
    layerCount: [12, 10],
    layerAlphaBase: 0.03,
    layerAlphaVar: 0.02,
    deformInit: 0.1,
    stretch: [1.1, 0.3],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0.14,
    splat: 0.25,
    dripAlpha: 0.04,
    dripWidthMul: 0.6,
    threadAlpha: 0.2,
    causticAlpha: 0.15,
    gravity: 0.3,
    grain: { base: 245, spread: 8, warm: false, alpha: 8, density: 0.03 },
  },
  sketch: `
  if (!this.genome) {
    const rnd = () => (Math.random() - 0.5) * 1.6;
    this.genome = { xf: Array.from({length: 4}, (_, i) => ({
      a: rnd(), b: rnd(), c: rnd(), d: rnd(), e: rnd() * 0.5, f: rnd() * 0.5, v: i % 4 })) };
    this.px = 0.1; this.py = 0.1; this.gen = 0;
  }
  this.glow = this.glow || new Array(12).fill(0);
  this.lastStrikes = this.lastStrikes == null ? audio.strikesLast10s : this.lastStrikes;
  let mx = 0;
  for (let i = 0; i < 12; i++) mx = Math.max(mx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const tg = mx > 0 ? audio.chroma[i] / mx : 0;
    this.glow[i] += (tg - this.glow[i]) * 0.05;
  }
  const tops = this.glow.map((g, i) => [i, g]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
  const sym = Math.max(3, Math.min(5, this.glow.filter(g => g > 0.1).length + 2));
  const drift = 0.002 + Math.min(0.02, audio.flux * 0.4);
  for (const x of this.genome.xf) {
    x.a += (Math.random() - 0.5) * drift; x.b += (Math.random() - 0.5) * drift;
    x.c += (Math.random() - 0.5) * drift; x.d += (Math.random() - 0.5) * drift;
  }
  if (audio.strikesLast10s > this.lastStrikes) {
    this.gen++;
    const x = this.genome.xf[(Math.random() * 4) | 0];
    x.a += (Math.random() - 0.5) * 0.3; x.d += (Math.random() - 0.5) * 0.3;
    if (Math.random() < 0.35) x.v = (Math.random() * 4) | 0;
  }
  this.lastStrikes = audio.strikesLast10s;
  for (const x of this.genome.xf) {
    for (const k of ['a','b','c','d']) x[k] = Math.max(-1.1, Math.min(1.1, x[k]));
    for (const k of ['e','f']) x[k] = Math.max(-0.7, Math.min(0.7, x[k]));
  }
  const S = Math.min(w, h) * 0.26;
  const cxs = [w * 0.3, w * 0.7], cy = h / 2;
  const breatheL = 1 + 0.15 * Math.sin(t * 0.7), breatheR = 1 + 0.15 * Math.sin(t * 0.7 + Math.PI);
  const bright = 0.12 + audio.level * 0.28;
  let px = this.px, py = this.py;
  this.bridge = [];
  for (let i = 0; i < 1500; i++) {
    const k = (Math.random() * 4) | 0;
    const xf = this.genome.xf[k];
    let nx = xf.a * px + xf.b * py + xf.e;
    let ny = xf.c * px + xf.d * py + xf.f;
    if (xf.v === 0) { px = Math.sin(nx); py = Math.sin(ny); }
    else if (xf.v === 1) { const r2 = nx*nx + ny*ny; px = nx * Math.sin(r2) - ny * Math.cos(r2); py = nx * Math.cos(r2) + ny * Math.sin(r2); }
    else if (xf.v === 2) { const r2 = nx*nx + ny*ny + 0.15; px = nx / r2; py = ny / r2; }
    else { const r = Math.hypot(nx, ny) + 0.15; px = (nx - ny) * (nx + ny) / r; py = 2 * nx * ny / r; }
    px = Math.max(-2, Math.min(2, px)); py = Math.max(-2, Math.min(2, py));
    if (i < 20) continue;
    const pc = tops[k % tops.length];
    ctx.fillStyle = color(pc, bright, 0.78, 0.13);
    const baseA = Math.atan2(py, px) + t * 0.04;
    const r = Math.hypot(px, py);
    for (let s = 0; s < sym; s++) {
      const a = baseA + s * Math.PI * 2 / sym;
      const xl = cxs[0] + Math.cos(a) * r * S * breatheL;
      const yl = cy + Math.sin(a) * r * S * breatheL * 0.9;
      const xr = cxs[1] - Math.cos(a) * r * S * breatheR;
      const yr = cy + Math.sin(a) * r * S * breatheR * 0.9;
      ctx.fillRect(xl, yl, 2.2, 2.2);
      ctx.fillRect(xr, yr, 2.2, 2.2);
      if (s === 0 && Math.random() < 0.004 && this.glow[pc] > 0.3) this.bridge.push({ xl, yl, xr, yr, pc });
    }
  }
  this.px = px; this.py = py;
  for (const b of this.bridge) {
    const g = ctx.createLinearGradient(b.xl, b.yl, b.xr, b.yr);
    g.addColorStop(0, color(b.pc, 0.12, 0.8, 0.11));
    g.addColorStop(0.5, color(b.pc, 0.04, 0.85, 0.09));
    g.addColorStop(1, color(b.pc, 0.12, 0.8, 0.11));
    ctx.strokeStyle = g; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(b.xl, b.yl);
    ctx.quadraticCurveTo(w / 2, cy + Math.sin(t * 0.5) * h * 0.1, b.xr, b.yr);
    ctx.stroke();
  }
  ctx.fillStyle = color(tops[0], 0.3, 0.75, 0.1);
  ctx.font = (11 * (w / 1400)) + 'px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText('twin nebula · gen ' + this.gen, w - 20, h - 16);`,
});
