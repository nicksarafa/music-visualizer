/* aurora — curtains of light in an arctic sky.
   Every strike hangs vertically, a sheet of charged air; green and
   violet ribbons breathe over a near-black horizon dusted with stars. */

PIGMENT.registerSkin({
  name: "aurora",
  vars: {
    "--paper": "oklch(0.13 0.02 220)",
    "--paper-deep": "oklch(0.08 0.015 240)",
    "--ink": "oklch(0.9 0.01 200)",
    "--ink-soft": "oklch(0.63 0.015 210)",
    "--hairline": "oklch(0.3 0.02 220)",
    "--panel-bg": "oklch(0.13 0.02 220 / 0.87)",
    "--bg": `radial-gradient(140% 60% at 50% 108%, oklch(0.2 0.045 200 / 0.8), transparent 55%),
             radial-gradient(150% 130% at 50% 40%, oklch(0.125 0.02 225) 40%, oklch(0.07 0.015 245) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#0c1220",
    leanMode: "vertical",
    stretch: [2.0, 0.8],       // long hanging sheets
    deformInit: 0.14,
    deformLayer: 0.1,          // shimmering ragged hems
    layerCount: [20, 22],
    layerAlphaBase: 0.014,
    layerAlphaVar: 0.012,
    sizeMul: 1.2,
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.07,
    dripWidthMul: 0.55,        // falling light
    threadAlpha: 0.16,
    grain: { base: 255, spread: 0, warm: false, alpha: 55, density: 0.006 },
  },
  // the aurora's gamut: fifths walk from ion green through teal to violet
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const hue = 148 + (fifth / 11) * 170 + hueOff * 0.3;   // 148 green .. 318 violet
    const l = 0.68 + Math.sin(seed * 12.9898) * 0.08 - (1 - quality) * 0.06;
    const c = 0.16 + Math.sin(seed * 78.233) * 0.03;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.8 0.15 170 / ${alpha.toFixed(3)})`;
  },
});
