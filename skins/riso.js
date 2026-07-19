/* riso — risograph print shop.
   Four spot inks only: fluorescent pink, medium blue, sunflower, and
   green. Flat overlapping shapes, honest paper grain, and the happy
   misregistration of a machine that never quite lines up. */

PIGMENT.registerSkin({
  name: "riso",
  vars: {
    "--paper": "oklch(0.965 0.012 95)",
    "--paper-deep": "oklch(0.945 0.014 95)",
    "--ink": "oklch(0.32 0.06 268)",
    "--ink-soft": "oklch(0.55 0.05 268)",
    "--hairline": "oklch(0.87 0.014 95)",
    "--panel-bg": "oklch(0.965 0.012 95 / 0.92)",
    "--bg": `radial-gradient(140% 120% at 50% 50%, oklch(0.965 0.012 95) 55%, oklch(0.942 0.015 95) 100%)`,
  },
  params: {
    paperHex: "#f5f1e2",
    layerCount: [4, 3],
    layerAlphaBase: 0.16,
    layerAlphaVar: 0.05,
    deformInit: 0.08,
    deformLayer: 0.015,
    stretch: [1.1, 0.3],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.14,
    dripWidthMul: 0.9,
    threadAlpha: 0.5,
    grain: { base: 235, spread: 20, warm: true, alpha: 14, density: 0.6 },
  },
  // pitch class -> one of four spot inks, by circle-of-fifths quadrant
  color(pc, alpha, seed, quality = 1) {
    const fifth = (pc * 7) % 12;
    const INKS = [
      [0.68, 0.21, 356],   // fluorescent pink
      [0.85, 0.15, 98],    // sunflower
      [0.55, 0.16, 258],   // medium blue
      [0.7, 0.15, 152],    // green
    ];
    const [l, c, h] = INKS[Math.floor(fifth / 3)];
    const lj = l + Math.sin(seed * 12.9898) * 0.03 - (1 - quality) * 0.05;
    return `oklch(${lj.toFixed(3)} ${c} ${h} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.35 0.05 268 / ${alpha.toFixed(3)})`;
  },
});
