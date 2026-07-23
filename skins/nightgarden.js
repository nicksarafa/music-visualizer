/* night garden — strikes germinate interval-shaped trees.
   Born live in the 2026-07-23 conductor residency: every strike
   plants a tree at the soil line whose branching spread comes from
   the width of the chord's strongest interval — tight seconds grow
   cypress-narrow, open sixths grow oak-broad. Blossoms open in the
   triad's colors once grown; fireflies drift through when the room is
   warm; everything sways in a wind made of loudness. A living skin. */

PIGMENT.registerSkin({
  name: "night garden",
  vars: {
    "--paper": "oklch(0.17 0.03 300)",
    "--paper-deep": "oklch(0.12 0.03 305)",
    "--ink": "oklch(0.9 0.02 320)",
    "--ink-soft": "oklch(0.64 0.028 310)",
    "--hairline": "oklch(0.28 0.03 302)",
    "--panel-bg": "oklch(0.16 0.03 301 / 0.9)",
    "--bg": `radial-gradient(120% 70% at 50% -10%, oklch(0.24 0.05 310 / 0.7), transparent 60%),
             radial-gradient(140% 120% at 50% 60%, oklch(0.165 0.03 301) 45%, oklch(0.1 0.028 308) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#191225",
    layerCount: [12, 10],
    layerAlphaBase: 0.028,
    layerAlphaVar: 0.02,
    deformInit: 0.11,
    stretch: [1.1, 0.3],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0.1,
    splat: 0.15,
    dripAlpha: 0.04,
    dripWidthMul: 0.6,
    threadAlpha: 0.16,
    capillary: 0.35,
    gravity: -0.2,
    grain: { base: 246, spread: 8, warm: false, alpha: 8, density: 0.04 },
  },
  sketch: `
  this.glow = this.glow || new Array(12).fill(0);
  this.plants = this.plants || [];
  this.lastStrikes = this.lastStrikes == null ? audio.strikesLast10s : this.lastStrikes;
  let mx = 0;
  for (let i = 0; i < 12; i++) mx = Math.max(mx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const tg = mx > 0 ? audio.chroma[i] / mx : 0;
    this.glow[i] += (tg - this.glow[i]) * 0.05;
  }
  const grow = (pc, seed) => {
    let best = 0, iv = 7;
    for (let i = 0; i < 12; i++) {
      if (i === pc) continue;
      if (this.glow[i] > best) { best = this.glow[i]; iv = ((i - pc) + 12) % 12; }
    }
    const spread = 0.25 + (iv / 11) * 0.6;
    const segs = [];
    const rec = (x, y, a, len, depth, s) => {
      if (depth > 4 || len < 8) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      segs.push({ x, y, x2, y2, depth, tip: depth === 4 || len * 0.72 < 8 });
      const j = Math.sin(s * 127.1) * 0.15;
      rec(x2, y2, a - spread + j, len * 0.72, depth + 1, s * 1.7 + 1);
      rec(x2, y2, a + spread * 0.8 + j, len * 0.72, depth + 1, s * 2.3 + 2);
    };
    rec(0, 0, -Math.PI / 2, Math.min(w, h) * 0.11, 0, seed);
    return segs;
  };
  if (audio.strikesLast10s > this.lastStrikes) {
    const pc = audio.dominantPc >= 0 ? audio.dominantPc : 0;
    const seed = Math.random() * 10 + 1;
    if (this.plants.length >= 8) this.plants.shift();
    this.plants.push({ x: w * (0.08 + Math.random() * 0.84), pc, seed, segs: grow(pc, seed), g: 0 });
  }
  this.lastStrikes = audio.strikesLast10s;
  const wind = Math.sin(t * 0.8) * 0.02 * (1 + audio.level * 4);
  for (const p of this.plants) {
    p.g = Math.min(1, p.g + 0.003 + audio.level * 0.004);
    const upto = Math.floor(p.segs.length * p.g);
    ctx.save();
    ctx.translate(p.x, h);
    ctx.rotate(wind * (1 + p.seed % 1));
    for (let i = 0; i < upto; i++) {
      const s = p.segs[i];
      ctx.strokeStyle = color(p.pc, 0.28 - s.depth * 0.035 + this.glow[p.pc] * 0.2, 0.6 + s.depth * 0.05, 0.12);
      ctx.lineWidth = Math.max(0.8, 5 - s.depth * 1.1);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x2, s.y2); ctx.stroke();
      if (s.tip && p.g > 0.85) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + s.x2 * 0.05);
        const bloomPc = (p.pc + [0, 4, 7][i % 3]) % 12;
        ctx.fillStyle = color(bloomPc, (0.3 + this.glow[bloomPc] * 0.4) * pulse + 0.1, 0.82, 0.12);
        ctx.beginPath();
        ctx.arc(s.x2, s.y2, 2.2 + pulse * 2.5 + audio.level * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (audio.level > 0.12) {
    this.ff = this.ff || Array.from({length: 20}, () => ({ x: Math.random() * w, y: h * (0.5 + Math.random() * 0.45), ph: Math.random() * 6.28 }));
    for (const f of this.ff) {
      f.ph += 0.05; f.x += Math.sin(f.ph * 1.3) * 0.8; f.y += Math.cos(f.ph) * 0.4 - 0.05;
      if (f.y < h * 0.4) f.y = h * 0.95;
      const blink = Math.max(0, Math.sin(f.ph * 2)) ** 3;
      if (blink < 0.1) continue;
      const pc = audio.dominantPc >= 0 ? audio.dominantPc : 9;
      ctx.fillStyle = color(pc, blink * 0.5, 0.85, 0.1);
      ctx.beginPath(); ctx.arc(f.x, f.y, 1.5 + blink * 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.fillStyle = color(audio.dominantPc >= 0 ? audio.dominantPc : 0, 0.3, 0.75, 0.11);
  ctx.font = (11 * (w / 1400)) + 'px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText('night garden · ' + this.plants.length + ' plants', w - 20, h - 16);`,
});
