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
