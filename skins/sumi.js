/* sumi — ink wash on rice paper.
   Nearly monochrome: pitch controls the depth of the ink, not its hue.
   When C sounds, the artist's vermilion seal appears — the one color
   permitted in the room. */

PIGMENT.registerSkin({
  name: "sumi",
  vars: {
    "--paper": "oklch(0.962 0.005 95)",
    "--paper-deep": "oklch(0.94 0.006 95)",
    "--ink": "oklch(0.25 0.008 80)",
    "--ink-soft": "oklch(0.5 0.008 80)",
    "--hairline": "oklch(0.87 0.006 95)",
    "--panel-bg": "oklch(0.962 0.005 95 / 0.92)",
    "--bg": `radial-gradient(130% 100% at 50% 0%, oklch(0.975 0.004 95), transparent 55%),
             radial-gradient(140% 120% at 50% 55%, oklch(0.962 0.005 95) 50%, oklch(0.937 0.006 95) 100%)`,
  },
  params: {
    paperHex: "#f2f0e9",
    granulate: false,
    edgeAlpha: 0.09,
    glossAlpha: 0,
    dripAlpha: 0.05,
    dripWidthMul: 0.7,
    threadAlpha: 0.26,
    layerAlphaBase: 0.028,
    layerAlphaVar: 0.02,
    deformInit: 0.17,
    deformLayer: 0.03,
    stretch: [1.4, 0.6],
    grain: { base: 236, spread: 12, warm: false, alpha: 8, density: 0.4 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    if (pc === 0) {                       // the vermilion seal, only for C
      const l = 0.55 + Math.sin(seed * 12.9898) * 0.04;
      return `oklch(${l.toFixed(3)} 0.165 32 / ${alpha.toFixed(3)})`;
    }
    // ink depth follows the circle of fifths: sharp keys pale, flat keys deep
    const fifth = (pc * 7) % 12;
    const l = 0.24 + (fifth / 12) * 0.34
            + Math.sin(seed * 12.9898) * 0.05 + (1 - quality) * 0.04;
    const c = 0.012 + Math.sin(seed * 78.233) * 0.006;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} 80 / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    if (pc === 0) return `oklch(0.45 0.17 32 / ${alpha.toFixed(3)})`;
    return `oklch(0.2 0.01 80 / ${alpha.toFixed(3)})`;
  },
});
