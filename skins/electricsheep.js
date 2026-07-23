/* electric sheep — a fractal flame that breeds with the music.
   Born live in the 2026-07-23 conductor residency, generation 5,
   nine-fold. A chaos-game flame whose genome drifts with spectral
   flux, mutates on every strike, and takes its symmetry from how many
   notes are alive — so it never dreams the same dream twice. A living
   skin: the flame runs whenever this paint is selected. */

PIGMENT.registerSkin({
  name: "electric sheep",
  vars: {
    "--paper": "oklch(0.3 0.045 205)",
    "--paper-deep": "oklch(0.22 0.05 215)",
    "--ink": "oklch(0.9 0.02 190)",
    "--ink-soft": "oklch(0.66 0.03 200)",
    "--hairline": "oklch(0.4 0.04 208)",
    "--panel-bg": "oklch(0.28 0.045 207 / 0.9)",
    "--bg": `radial-gradient(120% 80% at 50% -10%, oklch(0.36 0.06 215 / 0.7), transparent 60%),
             radial-gradient(140% 120% at 50% 55%, oklch(0.29 0.048 206) 45%, oklch(0.19 0.05 218) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#173840",
    ringed: true,
    layerCount: [10, 8],
    layerAlphaBase: 0.038,
    layerAlphaVar: 0.024,
    deformInit: 0.07,
    deformDepth: 3,
    stretch: [1.05, 0.2],
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.18,
    dripAlpha: 0.05,
    dripWidthMul: 0.6,
    threadAlpha: 0.2,
    causticAlpha: 0.2,
    gravity: 0.4,
    grain: { base: 240, spread: 10, warm: false, alpha: 6, density: 0.2 },
  },
  sketch: `
  if (!this.genome) {
    const rnd = () => (Math.random() - 0.5) * 1.6;
    this.genome = { sym: 5, xf: Array.from({length: 4}, () => ({
      a: rnd(), b: rnd(), c: rnd(), d: rnd(), e: rnd() * 0.5, f: rnd() * 0.5 })) };
    this.px = 0.1; this.py = 0.1;
    this.gen = 0;
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
  const alive = this.glow.filter(g => g > 0.1).length;
  this.genome.sym = Math.max(3, Math.min(9, alive + 3));
  const drift = 0.002 + Math.min(0.02, audio.flux * 0.4);
  for (const x of this.genome.xf) {
    x.a += (Math.random() - 0.5) * drift; x.b += (Math.random() - 0.5) * drift;
    x.c += (Math.random() - 0.5) * drift; x.d += (Math.random() - 0.5) * drift;
  }
  if (audio.strikesLast10s > this.lastStrikes) {
    this.gen++;
    const x = this.genome.xf[(Math.random() * 4) | 0];
    x.a += (Math.random() - 0.5) * 0.3; x.d += (Math.random() - 0.5) * 0.3;
    x.e += (Math.random() - 0.5) * 0.2; x.f += (Math.random() - 0.5) * 0.2;
  }
  this.lastStrikes = audio.strikesLast10s;
  for (const x of this.genome.xf) {
    for (const k of ['a','b','c','d']) x[k] = Math.max(-1.1, Math.min(1.1, x[k]));
    for (const k of ['e','f']) x[k] = Math.max(-0.7, Math.min(0.7, x[k]));
  }
  const cx = w / 2, cy = h / 2, S = Math.min(w, h) * 0.34;
  const rot = t * 0.03;
  const bright = 0.05 + audio.level * 0.16;
  let px = this.px, py = this.py;
  for (let i = 0; i < 2200; i++) {
    const k = (Math.random() * 4) | 0;
    const xf = this.genome.xf[k];
    const nx = xf.a * px + xf.b * py + xf.e;
    const ny = xf.c * px + xf.d * py + xf.f;
    px = Math.sin(nx); py = Math.sin(ny);
    if (i < 20) continue;
    const pc = tops[k % tops.length];
    ctx.fillStyle = color(pc, bright, 0.78, 0.13);
    const baseA = Math.atan2(py, px) + rot;
    const r = Math.hypot(px, py) * S;
    for (let s = 0; s < this.genome.sym; s++) {
      const a = baseA + s * Math.PI * 2 / this.genome.sym;
      ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, 1.4, 1.4);
    }
  }
  this.px = px; this.py = py;
  ctx.fillStyle = color(tops[0], 0.3, 0.75, 0.1);
  ctx.font = (11 * (w / 1400)) + 'px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText('electric sheep · generation ' + this.gen + ' · ' + this.genome.sym + '-fold', w - 20, h - 16);`,
});
