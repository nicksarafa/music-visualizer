/* lantern pond — a dusk pond that ferries the music.
   Born live in the 2026-07-23 conductor residency: every strike
   launches a paper boat carrying its note's flame across the water;
   koi shadows glide beneath, and when the room goes still a moonpath
   opens on the surface. A living skin — its sketch layer runs
   whenever the paint is selected. */

PIGMENT.registerSkin({
  name: "lantern pond",
  vars: {
    "--paper": "oklch(0.36 0.035 210)",
    "--paper-deep": "oklch(0.28 0.04 220)",
    "--ink": "oklch(0.9 0.02 190)",
    "--ink-soft": "oklch(0.68 0.025 200)",
    "--hairline": "oklch(0.45 0.03 210)",
    "--panel-bg": "oklch(0.33 0.035 212 / 0.9)",
    "--bg": `radial-gradient(120% 80% at 50% -10%, oklch(0.42 0.05 230 / 0.8), transparent 60%),
             radial-gradient(140% 120% at 50% 60%, oklch(0.34 0.038 212) 45%, oklch(0.24 0.04 225) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#233c44",
    ringed: true,
    layerCount: [10, 8],
    layerAlphaBase: 0.04,
    layerAlphaVar: 0.026,
    deformInit: 0.06,
    deformDepth: 3,
    stretch: [1.05, 0.2],
    sizeMul: 1.15,
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.22,
    dripAlpha: 0.03,
    dripWidthMul: 0.6,
    threadAlpha: 0.16,
    capillary: 0.45,
    interferenceAlpha: 0.25,
    causticAlpha: 0.3,
    strokeMode: "nacre",
    gravity: 0.15,
    grain: { base: 240, spread: 10, warm: false, alpha: 5, density: 0.25 },
  },
  sketch: `
  this.boats = this.boats || [];
  this.ripples = this.ripples || [];
  this.koi = this.koi || [];
  this.still = this.still == null ? 0 : this.still;
  this.lastStrikes = this.lastStrikes == null ? audio.strikesLast10s : this.lastStrikes;
  const R = Math.min(w, h);
  const pc0 = audio.dominantPc >= 0 ? audio.dominantPc : 4;
  // current
  ctx.lineWidth = 0.8;
  for (let ln = 0; ln < 5; ln++) {
    const y0 = h * (0.25 + ln * 0.12);
    ctx.strokeStyle = color((pc0 + ln * 7) % 12, 0.05 + audio.level * 0.05, 0.75, 0.09);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 24) {
      const y = y0 + Math.sin(x * 0.006 + t * (0.35 + audio.level) + ln * 1.7) * h * 0.018;
      if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // moonpath clarifies with stillness
  this.still += ((audio.level < 0.12 ? 1 : 0) - this.still) * 0.005;
  if (this.still > 0.05) {
    const px = w * 0.64, pw = R * (0.03 + this.still * 0.08);
    for (let y = h * 0.3; y < h; y += 8) {
      const sway = Math.sin(y * 0.03 + t * 1.5) * (2 + (1 - this.still) * 10 + audio.level * 12);
      const fade = (y - h * 0.3) / (h * 0.7);
      ctx.fillStyle = color(pc0, this.still * 0.15 * (1 - fade * 0.6), 0.9, 0.05);
      ctx.fillRect(px + sway - pw / 2, y, pw, 5);
    }
  }
  // a strike launches a boat; a second koi swims under it
  if (audio.strikesLast10s > this.lastStrikes) {
    if (this.boats.length < 10) this.boats.push({ x: -30, y: h * (0.28 + Math.random() * 0.5), pc: pc0, ph: Math.random() * 6.28 });
    if (this.koi.length < 5) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.koi.push({ x: dir > 0 ? -40 : w + 40, y: h * (0.45 + Math.random() * 0.4), dir, ph: Math.random() * 6.28, pc: pc0 });
    }
  }
  this.lastStrikes = audio.strikesLast10s;
  if (!this.boats.length && t > 1) this.boats.push({ x: -30, y: h * 0.5, pc: pc0, ph: 0 });
  for (let i = this.boats.length - 1; i >= 0; i--) {
    const b = this.boats[i];
    b.ph += 0.03; b.x += 0.45 + audio.level * 2; b.y += Math.sin(b.ph) * 0.3;
    if (b.x > w + 40) { this.boats.splice(i, 1); continue; }
    if (Math.random() < 0.02) this.ripples.push({ x: b.x - 10, y: b.y + 4, r: 4, life: 1, pc: b.pc });
    const bob = Math.sin(b.ph * 2) * 2, s = R * 0.015;
    ctx.fillStyle = color(b.pc, 0.4, 0.45, 0.1);
    ctx.beginPath();
    ctx.moveTo(b.x - s * 1.6, b.y + bob);
    ctx.quadraticCurveTo(b.x, b.y + bob + s * 1.3, b.x + s * 1.6, b.y + bob);
    ctx.quadraticCurveTo(b.x, b.y + bob + s * 0.4, b.x - s * 1.6, b.y + bob);
    ctx.fill();
    const fl = 1 + Math.min(0.5, audio.flux * 6) * Math.sin(t * 19 + b.ph);
    const g = ctx.createRadialGradient(b.x, b.y + bob - s * 0.7, 0, b.x, b.y + bob - s * 0.7, s * 3.4);
    g.addColorStop(0, color(b.pc, 0.5 * fl, 0.9, 0.08));
    g.addColorStop(1, color(b.pc, 0, 0.8, 0.1));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y + bob - s * 0.7, s * 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color(b.pc, 0.7 * fl, 0.93, 0.05);
    ctx.beginPath(); ctx.arc(b.x, b.y + bob - s * 0.7, s * 0.5 * fl, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = this.ripples.length - 1; i >= 0; i--) {
    const r = this.ripples[i];
    r.r += 0.8 + audio.level; r.life -= 0.012;
    if (r.life <= 0) { this.ripples.splice(i, 1); continue; }
    ctx.strokeStyle = color(r.pc, r.life * 0.15, 0.8, 0.09);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 1.6, r.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
  for (let i = this.koi.length - 1; i >= 0; i--) {
    const k = this.koi[i];
    k.ph += 0.09; k.x += k.dir * (1.2 + audio.level * 1.5); k.y += Math.sin(k.ph) * 0.8;
    if (k.x < -60 || k.x > w + 60) { this.koi.splice(i, 1); continue; }
    const flex = Math.sin(k.ph * 2) * 0.25;
    ctx.save();
    ctx.translate(k.x, k.y); ctx.rotate(k.dir > 0 ? flex : Math.PI + flex);
    ctx.fillStyle = color(k.pc, 0.13, 0.4, 0.09);
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-36, -7 + flex * 20); ctx.lineTo(-36, 7 + flex * 20); ctx.fill();
    ctx.restore();
  }`,
});
