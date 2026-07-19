/* meteor — a shower over the edge of the atmosphere.
   Strikes circle in on a turning arm while their trails burn upward
   and away: falling stars seen from above the sky. */

PIGMENT.registerSkin({
  name: "meteor",
  vars: {
    "--paper": "oklch(0.1 0.018 255)",
    "--paper-deep": "oklch(0.06 0.014 265)",
    "--ink": "oklch(0.9 0.008 255)",
    "--ink-soft": "oklch(0.6 0.012 255)",
    "--hairline": "oklch(0.27 0.018 255)",
    "--panel-bg": "oklch(0.1 0.018 255 / 0.86)",
    "--bg": `radial-gradient(100% 80% at 30% 20%, oklch(0.14 0.03 250 / 0.8), transparent 60%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.095 0.018 255) 40%, oklch(0.055 0.013 268) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#0a0d18",
    placement: "orbit",
    gravity: -0.85,            // trails burn upward
    sizeMul: 0.7,              // compact burning heads
    layerCount: [12, 12],
    layerAlphaBase: 0.022,
    layerAlphaVar: 0.018,
    deformInit: 0.17,
    deformLayer: 0.07,
    stretch: [1.7, 0.7],
    splat: 0.5,                // debris flung off on impact
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.12,
    dripWidthMul: 0.35,        // long thin burn trails
    threadAlpha: 0.22,
    grain: { base: 255, spread: 0, warm: false, alpha: 70, density: 0.009 },
  },
  // burn colors: icy blue-white heads through gold to copper tails
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const t = fifth / 11;
    const hue = 250 - t * 190;                 // 250 ice .. 60 copper
    const l = 0.72 - t * 0.1 + Math.sin(seed * 12.9898) * 0.06;
    const c = 0.1 + t * 0.09;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.85 0.06 250 / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    return `oklch(0.93 0.05 230 / ${Math.min(1, alpha * 2.6).toFixed(3)})`;
  },
});
