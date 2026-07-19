/* koi — a pond hearing rain.
   Every chord is a drop breaking jade-green water into ripples; now
   and then a koi flashes orange beneath the rings. */

PIGMENT.registerSkin({
  name: "koi",
  vars: {
    "--paper": "oklch(0.9 0.025 175)",
    "--paper-deep": "oklch(0.85 0.032 180)",
    "--ink": "oklch(0.3 0.03 190)",
    "--ink-soft": "oklch(0.5 0.028 185)",
    "--hairline": "oklch(0.8 0.026 178)",
    "--panel-bg": "oklch(0.9 0.025 175 / 0.9)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.93 0.02 170 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 55%, oklch(0.895 0.026 176) 50%, oklch(0.84 0.034 184) 100%)`,
  },
  params: {
    paperHex: "#cfe3d6",
    ringed: true,
    layerCount: [10, 7],
    layerAlphaBase: 0.045,
    layerAlphaVar: 0.028,
    deformInit: 0.06,
    deformDepth: 3,
    deformLayer: 0.018,
    stretch: [1.05, 0.15],
    sizeMul: 1.25,
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.24,          // sun on water
    dripAlpha: 0.04,
    dripWidthMul: 0.5,
    dripBead: false,
    threadAlpha: 0.15,         // faint surface tension lines
    threadNodes: true,
    grain: { base: 235, spread: 12, warm: false, alpha: 6, density: 0.3 },
  },
  // ripple rings in deep pond tones; every few rings, a koi passes
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const roll = Math.sin(seed * 733.1);
    if (roll > 0.52) {         // the koi: persimmon orange
      return `oklch(0.62 0.18 42 / ${(alpha * 1.4).toFixed(3)})`;
    }
    const fifth = (pc * 7) % 12;
    const l = 0.3 + (fifth / 11) * 0.28 + Math.sin(seed * 12.9898) * 0.04;
    const hue = 195 + (fifth / 11) * 40;   // teal into deep blue-green
    return `oklch(${l.toFixed(3)} 0.055 ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.32 0.05 200 / ${alpha.toFixed(3)})`;
  },
  // lily beads where threads anchor
  accent(pc, alpha, seed) {
    return `oklch(0.63 0.17 45 / ${Math.min(1, alpha * 1.8).toFixed(3)})`;
  },
});
