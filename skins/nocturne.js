/* nocturne — luminous paint on a glossy midnight ground.
   The same harmony, heard after dark: washes of light that bloom and
   breathe against deep indigo, like lanterns under lacquer. */

PIGMENT.registerSkin({
  name: "nocturne",
  vars: {
    "--paper": "oklch(0.19 0.03 268)",
    "--paper-deep": "oklch(0.13 0.026 275)",
    "--ink": "oklch(0.88 0.012 268)",
    "--ink-soft": "oklch(0.64 0.015 268)",
    "--hairline": "oklch(0.33 0.025 268)",
    "--panel-bg": "oklch(0.18 0.03 268 / 0.88)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.25 0.035 265 / 0.85), transparent 60%),
             radial-gradient(140% 120% at 50% 55%, oklch(0.185 0.03 268) 45%, oklch(0.12 0.024 278) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#121327",
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.10,
    dripAlpha: 0.05,
    threadAlpha: 0.20,
    layerAlphaBase: 0.020,
    layerAlphaVar: 0.014,
    grain: { base: 210, spread: 45, warm: false, alpha: 7, density: 0.03 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff + 360) % 360;
    const l = 0.66 + Math.sin(seed * 12.9898) * 0.07 - (1 - quality) * 0.08;
    const c = (0.19 + Math.sin(seed * 78.233) * 0.025) * (0.75 + quality * 0.25);
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.7 0.19 ${PIGMENT.helpers.pcHue(pc).toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
