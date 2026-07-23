/* storm glass — a dark instrument that rewards ferocity.
   Born live in the 2026-07-23 conductor residency: every strike sends
   a tide of its color sweeping up the glass; dense playing draws
   constellation lightning, and sustained loudness makes the whole
   field surge. Quiet rooms see only breathing glitter. A living skin —
   its sketch layer runs whenever the paint is selected. */

PIGMENT.registerSkin({
  name: "storm glass",
  vars: {
    "--paper": "oklch(0.13 0.02 265)",
    "--paper-deep": "oklch(0.09 0.018 270)",
    "--ink": "oklch(0.88 0.02 250)",
    "--ink-soft": "oklch(0.62 0.025 255)",
    "--hairline": "oklch(0.26 0.025 262)",
    "--panel-bg": "oklch(0.13 0.02 265 / 0.88)",
    "--bg": `radial-gradient(130% 60% at 50% -15%, oklch(0.2 0.05 275 / 0.8), transparent 55%),
             radial-gradient(150% 130% at 50% 45%, oklch(0.125 0.02 265) 40%, oklch(0.07 0.016 272) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#101020",
    layerCount: [14, 14],
    layerAlphaBase: 0.024,
    layerAlphaVar: 0.018,
    deformInit: 0.14,
    stretch: [1.2, 0.5],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0.2,
    splat: 0.5,
    dripAlpha: 0.05,
    dripWidthMul: 0.7,
    threadAlpha: 0.22,
    causticAlpha: 0.3,
    gravity: 0.6,
    grain: { base: 245, spread: 8, warm: false, alpha: 10, density: 0.04 },
  },
  sketch: `
  this.glitter = this.glitter || Array.from({length: 110}, () => ({
    x: Math.random() * w, y: Math.random() * h, ph: Math.random() * 6.28 }));
  this.tides = this.tides || [];
  this.bolts = this.bolts || [];
  this.boltAt = this.boltAt == null ? 0 : this.boltAt;
  this.lastStrikes = this.lastStrikes == null ? audio.strikesLast10s : this.lastStrikes;
  this.ff = this.ff == null ? 0 : this.ff;
  this.ff += ((audio.level > 0.4 ? (audio.level - 0.4) * 2.5 : 0) - this.ff) * 0.05;
  const FF = 1 + this.ff;
  const pc0 = audio.dominantPc >= 0 ? audio.dominantPc : 9;
  // glitter breathes; fortissimo makes it blaze
  for (const g of this.glitter) {
    g.ph += 0.08;
    const tw = Math.max(0, Math.sin(g.ph)) ** 4 * (0.12 + audio.level * 0.8) * Math.min(2.5, FF);
    if (tw < 0.03) continue;
    ctx.fillStyle = color(pc0, tw * 0.4, 0.9, 0.06);
    ctx.fillRect(g.x, g.y, 1.6, 1.6);
  }
  // strike tides sweep the glass
  if (audio.strikesLast10s > this.lastStrikes && this.tides.length < 5) {
    this.tides.push({ y: h + 40, pc: pc0, life: 1 });
  }
  this.lastStrikes = audio.strikesLast10s;
  for (let i = this.tides.length - 1; i >= 0; i--) {
    const td = this.tides[i];
    td.y -= 3.5 + audio.level * 5; td.life -= 0.006;
    if (td.life <= 0 || td.y < -80) { this.tides.splice(i, 1); continue; }
    const bandH = h * 0.16;
    const g = ctx.createLinearGradient(0, td.y - bandH, 0, td.y + bandH * 0.4);
    g.addColorStop(0, color(td.pc, 0, 0.78, 0.12));
    g.addColorStop(0.7, color(td.pc, 0.13 * td.life * FF, 0.78, 0.12));
    g.addColorStop(1, color(td.pc, 0, 0.78, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(0, td.y - bandH, w, bandH * 1.4);
    ctx.strokeStyle = color(td.pc, 0.3 * td.life, 0.88, 0.09);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 20) {
      const y = td.y + Math.sin(x * 0.02 + t * 4) * 4;
      if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // dense playing draws lightning
  if (audio.strikesLast10s >= 8 && t - this.boltAt > 1.4) {
    this.boltAt = t;
    const x1 = w * (0.1 + Math.random() * 0.8), y1 = h * (0.05 + Math.random() * 0.3);
    const x2 = w * (0.1 + Math.random() * 0.8), y2 = h * (0.35 + Math.random() * 0.4);
    const pts = [{ x: x1, y: y1 }];
    for (let s = 1; s < 7; s++) {
      pts.push({ x: x1 + (x2 - x1) * s / 7 + (Math.random() - 0.5) * 60,
        y: y1 + (y2 - y1) * s / 7 + (Math.random() - 0.5) * 40 });
    }
    pts.push({ x: x2, y: y2 });
    this.bolts.push({ pts, pc: pc0, life: 1 });
  }
  for (let i = this.bolts.length - 1; i >= 0; i--) {
    const b = this.bolts[i];
    b.life -= 0.06;
    if (b.life <= 0) { this.bolts.splice(i, 1); continue; }
    if (b.life > 0.85) {
      ctx.fillStyle = color(b.pc, 0.05, 0.9, 0.05);
      ctx.fillRect(0, 0, w, h);
    }
    ctx.strokeStyle = color(b.pc, b.life * 0.7, 0.92, 0.06);
    ctx.lineWidth = 1.2 + b.life * 2.4;
    ctx.beginPath();
    for (let p = 0; p < b.pts.length; p++) {
      const jx = b.pts[p].x + (Math.random() - 0.5) * 4, jy = b.pts[p].y + (Math.random() - 0.5) * 4;
      if (!p) ctx.moveTo(jx, jy); else ctx.lineTo(jx, jy);
    }
    ctx.stroke();
    ctx.strokeStyle = color(b.pc, b.life * 0.25, 0.8, 0.12);
    ctx.lineWidth = 5 * b.life;
    ctx.stroke();
  }`,
});
