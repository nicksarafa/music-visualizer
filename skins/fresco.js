/* fresco — earth pigments on warm plaster.
   A Pompeiian wall hearing music: sienna, ochre, olive and slate laid
   into wet lime, drying matte and grainy with crisp dry edges. */

PIGMENT.registerSkin({
  name: "fresco",
  vars: {
    "--paper": "oklch(0.915 0.022 72)",
    "--paper-deep": "oklch(0.875 0.026 68)",
    "--ink": "oklch(0.31 0.03 58)",
    "--ink-soft": "oklch(0.52 0.028 60)",
    "--hairline": "oklch(0.82 0.024 70)",
    "--panel-bg": "oklch(0.915 0.022 72 / 0.92)",
    "--bg": `radial-gradient(130% 100% at 50% -5%, oklch(0.935 0.02 74 / 0.9), transparent 55%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.912 0.022 72) 45%, oklch(0.868 0.028 66) 100%)`,
  },
  params: {
    paperHex: "#e8ddc8",
    granulate: true,
    edgeAlpha: 0.11,
    glossAlpha: 0,
    dripAlpha: 0.024,
    dripWidthMul: 0.8,
    threadAlpha: 0.24,
    layerAlphaBase: 0.03,
    layerAlphaVar: 0.018,
    deformLayer: 0.035,
    grain: { base: 222, spread: 30, warm: true, alpha: 21, density: 0.75 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    // compress the fifths wheel into the earth range: sienna through
    // ochre and olive to a single mineral slate-blue
    const fifth = (pc * 7) % 12;
    const hue = 28 + (fifth / 11) * 195 + hueOff * 0.4;
    const l = 0.5 + Math.sin(seed * 12.9898) * 0.11 - (1 - quality) * 0.05
            + (hue > 55 && hue < 120 ? 0.15 : 0);
    const c = (0.098 + Math.sin(seed * 78.233) * 0.018) * (0.8 + quality * 0.2);
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    const fifth = (pc * 7) % 12;
    const hue = 28 + (fifth / 11) * 195;
    return `oklch(0.4 0.09 ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
