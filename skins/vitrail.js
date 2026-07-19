/* vitrail — stained glass in afternoon light.
   Jewel-saturated panes leaded with dark seams, set into pale stone.
   Chords land as glass; the lead lines hold them together. */

PIGMENT.registerSkin({
  name: "vitrail",
  vars: {
    "--paper": "oklch(0.93 0.006 80)",
    "--paper-deep": "oklch(0.89 0.008 80)",
    "--ink": "oklch(0.28 0.01 80)",
    "--ink-soft": "oklch(0.5 0.01 80)",
    "--hairline": "oklch(0.84 0.008 80)",
    "--panel-bg": "oklch(0.93 0.006 80 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.955 0.005 85 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.928 0.006 80) 55%, oklch(0.885 0.009 78) 100%)`,
  },
  params: {
    paperHex: "#e9e5da",
    layerCount: [7, 5],       // few dense panes, not washes
    layerAlphaBase: 0.09,
    layerAlphaVar: 0.04,
    deformInit: 0.09,
    deformLayer: 0.012,       // crisp glass edges
    stretch: [1.15, 0.35],
    granulate: false,
    edgeAlpha: 0.5,           // the lead seam
    glossAlpha: 0.22,         // light through glass
    dripAlpha: 0.1,
    dripWidthMul: 0.8,
    threadAlpha: 0.55,        // threads read as lead came
    grain: { base: 232, spread: 16, warm: true, alpha: 9, density: 0.45 },
  },
  // jewel glass: saturated, moderately dark, glowing
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff * 0.3 + 360) % 360;
    const l = 0.55 + Math.sin(seed * 12.9898) * 0.06 - (1 - quality) * 0.07;
    const c = 0.17 + Math.sin(seed * 78.233) * 0.02;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  // lead, not pigment: the seams are near-black regardless of note
  edge(pc, alpha) {
    return `oklch(0.3 0.015 80 / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    return `oklch(0.32 0.015 80 / ${Math.min(1, alpha * 1.6).toFixed(3)})`;
  },
});
