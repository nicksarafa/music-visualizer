/* shan shui memory — the session painted as a landscape scroll.
   Born live in the 2026-07-23 conductor residency: the sketch records
   every quarter-second of listening and renders the session's music
   as ink mountains on rice paper — three strata, one per note-voice,
   ridge heights from loudness, a sun that climbs when the room sings
   and mist that gathers when it rests. The scroll drifts left as time
   passes; the paint layer adds small ink blossoms per strike. */

PIGMENT.registerSkin({
  name: "shan shui memory",
  vars: {
    "--paper": "oklch(0.96 0.008 95)",
    "--paper-deep": "oklch(0.93 0.01 95)",
    "--ink": "oklch(0.3 0.02 250)",
    "--ink-soft": "oklch(0.52 0.018 250)",
    "--hairline": "oklch(0.86 0.012 95)",
    "--panel-bg": "oklch(0.96 0.008 95 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.98 0.006 95 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.958 0.008 95) 55%, oklch(0.92 0.012 98) 100%)`,
  },
  params: {
    paperHex: "#f4f1e6",
    layerCount: [12, 10],
    layerAlphaBase: 0.03,
    layerAlphaVar: 0.02,
    deformInit: 0.1,
    deformDepth: 4,
    stretch: [1.15, 0.35],
    sizeMul: 0.62,
    granulate: true,
    edgeAlpha: 0.05,
    glossAlpha: 0,
    dripAlpha: 0.03,
    dripWidthMul: 0.5,
    threadAlpha: 0.12,
    capillary: 0.3,
    gravity: 0.3,
    grain: { base: 232, spread: 18, warm: true, alpha: 9, density: 0.4 },
  },
  sketch: `
  this.hist = this.hist || [];
  this.acc = this.acc == null ? 0 : this.acc;
  this.glow = this.glow || new Array(12).fill(0);
  let mx = 0;
  for (let i = 0; i < 12; i++) mx = Math.max(mx, audio.chroma[i]);
  for (let i = 0; i < 12; i++) {
    const tg = mx > 0 ? audio.chroma[i] / mx : 0;
    this.glow[i] += (tg - this.glow[i]) * 0.06;
  }
  this.acc += 1 / 60;
  if (this.acc > 0.25) {
    this.acc = 0;
    this.lv = (this.lv == null ? audio.level : this.lv + (audio.level - this.lv) * 0.3);
    const tops = this.glow.map((g, i) => [i, g]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    this.hist.push({ level: this.lv, tops });
    if (this.hist.length > 560) this.hist.shift();
  }
  if (!this.hist.length) return;
  const n = this.hist.length;
  const colW = w / 560;
  const horizon = h * 0.74;
  for (let layer = 2; layer >= 0; layer--) {
    ctx.beginPath();
    ctx.moveTo(w - n * colW, h);
    for (let i = 0; i < n; i++) {
      const m = this.hist[i];
      const x = w - (n - i) * colW;
      const ridge = horizon - m.level * h * (0.5 - layer * 0.13)
        - Math.sin(i * 0.07 + layer * 2.1) * h * 0.012 * (layer + 1)
        - layer * h * 0.05;
      ctx.lineTo(x, ridge);
    }
    ctx.lineTo(w, h); ctx.closePath();
    const recent = this.hist[Math.max(0, n - 8)].tops[layer] || [0, 0];
    // ink washes: darker for nearer ranges, tinted faintly by their era's note
    const fillG = ctx.createLinearGradient(0, horizon - h * 0.45, 0, h);
    fillG.addColorStop(0, color(recent[0], 0.16 - layer * 0.035, 0.38 + layer * 0.14, 0.05));
    fillG.addColorStop(1, color(recent[0], 0.02, 0.5, 0.04));
    ctx.fillStyle = fillG;
    ctx.fill();
    for (let i = 1; i < n; i += 2) {
      const m = this.hist[i];
      const tp = m.tops[layer];
      if (!tp || tp[1] < 0.15) continue;
      const x = w - (n - i) * colW;
      const ridge = horizon - m.level * h * (0.5 - layer * 0.13)
        - Math.sin(i * 0.07 + layer * 2.1) * h * 0.012 * (layer + 1)
        - layer * h * 0.05;
      ctx.fillStyle = color(tp[0], 0.16 + tp[1] * 0.22, 0.45, 0.13);
      ctx.fillRect(x, ridge - 1, colW * 1.6, 2);
    }
  }
  const pc0 = audio.dominantPc >= 0 ? audio.dominantPc : 0;
  const sx = w * 0.82, sy = horizon - h * 0.3 - audio.level * h * 0.16;
  const sr = Math.min(w, h) * (0.032 + audio.level * 0.02);
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3);
  g.addColorStop(0, color(pc0, 0.35, 0.75, 0.11));
  g.addColorStop(1, color(pc0, 0, 0.8, 0.1));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, sr * 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color(pc0, 0.4, 0.6, 0.12);
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.stroke();
  // mist gathers in the valleys when the room rests
  const mist = Math.max(0, 0.3 - audio.level * 0.5);
  if (mist > 0.02) {
    for (let b = 0; b < 3; b++) {
      const fy = horizon - h * (0.04 + b * 0.05) + Math.sin(t * 0.2 + b * 2) * h * 0.01;
      const fg = ctx.createLinearGradient(0, fy - h * 0.03, 0, fy + h * 0.03);
      fg.addColorStop(0, 'rgba(244,241,230,0)');
      fg.addColorStop(0.5, 'rgba(244,241,230,' + (mist * 0.5).toFixed(3) + ')');
      fg.addColorStop(1, 'rgba(244,241,230,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, fy - h * 0.03, w, h * 0.06);
    }
  }
  ctx.fillStyle = color(pc0, 0.35, 0.45, 0.12);
  ctx.font = (11 * (w / 1400)) + 'px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText('shan shui · ' + Math.round(n / 4) + 's of listening', w - 20, h - 16);`,
});
