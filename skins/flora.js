/* flora — a pressed-flower album.
   Chords arrive as petals and leaves laid between pages: elongated,
   crisp-edged, in rose, mauve, olive and fern, on cream stock. */

PIGMENT.registerSkin({
  name: "flora",
  vars: {
    "--paper": "oklch(0.96 0.012 90)",
    "--paper-deep": "oklch(0.935 0.015 88)",
    "--ink": "oklch(0.33 0.02 60)",
    "--ink-soft": "oklch(0.54 0.018 65)",
    "--hairline": "oklch(0.87 0.014 88)",
    "--panel-bg": "oklch(0.96 0.012 90 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.975 0.01 92 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.958 0.012 90) 55%, oklch(0.93 0.016 86) 100%)`,
  },
  params: {
    paperHex: "#f4efdf",
    layerCount: [12, 10],
    layerAlphaBase: 0.035,
    layerAlphaVar: 0.022,
    deformInit: 0.1,
    deformDepth: 3,
    deformLayer: 0.02,
    stretch: [1.9, 0.9],       // long petals and leaves
    sizeMul: 0.9,
    granulate: true,           // dried-petal texture
    edgeAlpha: 0.13,           // crisp pressed edges
    glossAlpha: 0,
    dripAlpha: 0.03,           // stems, barely
    dripWidthMul: 0.55,
    threadAlpha: 0.3,          // stems and tendrils between blooms
    grain: { base: 230, spread: 22, warm: true, alpha: 12, density: 0.55 },
  },
  // a herbarium's gamut, interleaved like a bouquet: even fifths press
  // as fern and olive leaves, odd fifths as rose and mauve petals
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const t = fifth / 11;
    const leaf = fifth % 2 === 0;
    const hue = leaf ? 138 - t * 50 : 348 - t * 55;
    const l = (leaf ? 0.55 : 0.62) + Math.sin(seed * 12.9898) * 0.08 + t * 0.05;
    const c = (leaf ? 0.075 : 0.095) + Math.sin(seed * 78.233) * 0.015;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${((hue + 360) % 360).toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.42 0.06 100 / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    // seed-pod dots
    return `oklch(0.45 0.08 80 / ${Math.min(1, alpha * 1.7).toFixed(3)})`;
  },
});
