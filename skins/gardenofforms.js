/* garden of forms — strike-seeded chemistry.
   Born live in the 2026-07-23 conductor residency: a Gray-Scott
   reaction-diffusion field where every strike plants a colony at its
   note's seat on the circle of fifths. Colonies spread their note's
   color as they grow into dotted rivers and labyrinths; loudness
   feeds the garden, flux makes it restless. A living skin — the
   chemistry runs whenever this paint is selected. */

PIGMENT.registerSkin({
  name: "garden of forms",
  vars: {
    "--paper": "oklch(0.24 0.03 180)",
    "--paper-deep": "oklch(0.17 0.03 190)",
    "--ink": "oklch(0.9 0.02 120)",
    "--ink-soft": "oklch(0.64 0.03 140)",
    "--hairline": "oklch(0.34 0.03 182)",
    "--panel-bg": "oklch(0.23 0.03 181 / 0.9)",
    "--bg": `radial-gradient(120% 80% at 50% -10%, oklch(0.3 0.045 190 / 0.7), transparent 60%),
             radial-gradient(140% 120% at 50% 55%, oklch(0.23 0.032 181) 45%, oklch(0.14 0.03 195) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#12312e",
    layerCount: [12, 10],
    layerAlphaBase: 0.03,
    layerAlphaVar: 0.02,
    deformInit: 0.12,
    stretch: [1.1, 0.3],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0.12,
    stippleDensity: 1.6,
    strokeMode: "stipple",
    dripAlpha: 0.05,
    dripWidthMul: 0.6,
    threadAlpha: 0.16,
    gravity: 0.5,
    grain: { base: 245, spread: 8, warm: true, alpha: 8, density: 0.05 },
  },
  sketch: `
  const GW = 96, GH = 54;
  if (!this.u) {
    this.u = new Float32Array(GW * GH).fill(1);
    this.v = new Float32Array(GW * GH);
    this.pcg = new Uint8Array(GW * GH).fill(255);
    this.u2 = new Float32Array(GW * GH);
    this.v2 = new Float32Array(GW * GH);
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
  if (audio.strikesLast10s > this.lastStrikes) {
    this.gen++;
    const pc = audio.dominantPc >= 0 ? audio.dominantPc : 0;
    const ang = ((pc * 7) % 12) / 12 * Math.PI * 2 - Math.PI / 2;
    const gx = Math.round(GW / 2 + Math.cos(ang) * GW * 0.3 + (Math.random() - 0.5) * 8);
    const gy = Math.round(GH / 2 + Math.sin(ang) * GH * 0.3 + (Math.random() - 0.5) * 5);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = (gx + dx + GW) % GW, y = (gy + dy + GH) % GH;
      this.v[y * GW + x] = 0.9;
      this.pcg[y * GW + x] = pc;
    }
  }
  this.lastStrikes = audio.strikesLast10s;
  const F = 0.052 + audio.level * 0.012;
  const K = 0.0615 + Math.min(0.004, audio.flux * 0.05);
  const Du = 0.19, Dv = 0.09;
  for (let step = 0; step < 2; step++) {
    const u = this.u, v = this.v, u2 = this.u2, v2 = this.v2, pcg = this.pcg;
    for (let y = 0; y < GH; y++) {
      const ym = ((y - 1 + GH) % GH) * GW, yp = ((y + 1) % GH) * GW, y0 = y * GW;
      for (let x = 0; x < GW; x++) {
        const xm = (x - 1 + GW) % GW, xp = (x + 1) % GW;
        const i = y0 + x;
        const lu = u[ym + x] + u[yp + x] + u[y0 + xm] + u[y0 + xp] - 4 * u[i];
        const lv = v[ym + x] + v[yp + x] + v[y0 + xm] + v[y0 + xp] - 4 * v[i];
        const uvv = u[i] * v[i] * v[i];
        u2[i] = Math.min(1, Math.max(0, u[i] + Du * lu - uvv + F * (1 - u[i])));
        v2[i] = Math.min(1, Math.max(0, v[i] + Dv * lv + uvv - (F + K) * v[i]));
        if (v2[i] > 0.15 && pcg[i] === 255) {
          const n = [pcg[ym + x], pcg[yp + x], pcg[y0 + xm], pcg[y0 + xp]].filter(p => p !== 255);
          if (n.length) pcg[i] = n[(Math.random() * n.length) | 0];
        }
      }
    }
    this.u.set(u2); this.v.set(v2);
  }
  const cw = w / GW, ch = h / GH;
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      const vv = this.v[i];
      if (vv < 0.12) continue;
      const pc = this.pcg[i] === 255 ? 0 : this.pcg[i];
      const a = Math.min(0.5, (vv - 0.12) * 1.1) * (0.5 + this.glow[pc] * 0.8 + audio.level * 0.4);
      ctx.fillStyle = color(pc, a, 0.72 + vv * 0.15, 0.13);
      ctx.beginPath();
      ctx.arc((x + 0.5) * cw, (y + 0.5) * ch, Math.max(cw, ch) * (0.35 + vv * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = color(0, 0.3, 0.75, 0.1);
  ctx.font = (11 * (w / 1400)) + 'px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText('garden of forms · ' + this.gen + ' colonies', w - 20, h - 16);`,
});
