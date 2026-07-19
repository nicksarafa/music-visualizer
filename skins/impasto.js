/* impasto — viscous oil dragged over primed linen.
   A few dense layers leave ridges, knife marks, and wet highlights;
   the gestures feel physical without turning into digital neon. */

PIGMENT.registerSkin({
  name: "impasto",
  vars: {
    "--paper": "oklch(0.91 0.012 84)",
    "--paper-deep": "oklch(0.87 0.016 78)",
    "--ink": "oklch(0.27 0.025 55)",
    "--ink-soft": "oklch(0.5 0.022 58)",
    "--hairline": "oklch(0.79 0.018 80)",
    "--panel-bg": "oklch(0.91 0.012 84 / 0.91)",
    "--bg": `radial-gradient(120% 90% at 50% -8%, oklch(0.94 0.01 88 / 0.9), transparent 56%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.905 0.013 84) 46%, oklch(0.855 0.018 76) 100%)`,
  },
  params: {
    paperHex: "#ddd5c8",
    strokeMode: "impasto",
    sizeMul: 0.88,
    layerCount: [6, 4],
    layerAlphaBase: 0.09,
    layerAlphaVar: 0.035,
    deformInit: 0.07,
    deformDepth: 2,
    deformLayer: 0.018,
    stretch: [1.65, 0.65],
    granulate: false,
    edgeAlpha: 0.12,
    glossAlpha: 0.3,
    dripAlpha: 0.055,
    dripWidthMul: 1.25,
    threadAlpha: 0.38,
    splat: 0.12,
    grain: { base: 218, spread: 25, warm: true, alpha: 18, density: 0.62 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff * 0.22 + 360) % 360;
    const l = 0.52 + Math.sin(seed * 12.9898) * 0.075 + quality * 0.06;
    const c = 0.16 + Math.sin(seed * 78.233) * 0.022;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.33 0.12 ${PIGMENT.helpers.pcHue(pc).toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
