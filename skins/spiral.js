/* spiral — galactic pigment for any movement.
   Luminous clouds, thin star trails, and spectral dust pair especially
   well with slow orbit, while remaining independent from composition. */

PIGMENT.registerSkin({
  name: "spiral",
  vars: {
    "--paper": "oklch(0.09 0.015 280)",
    "--paper-deep": "oklch(0.055 0.012 290)",
    "--ink": "oklch(0.9 0.008 280)",
    "--ink-soft": "oklch(0.6 0.012 280)",
    "--hairline": "oklch(0.26 0.018 280)",
    "--panel-bg": "oklch(0.1 0.015 280 / 0.85)",
    "--bg": `radial-gradient(90% 70% at 50% 50%, oklch(0.14 0.03 285 / 0.9), transparent 65%),
             radial-gradient(150% 130% at 50% 50%, oklch(0.085 0.015 280) 40%, oklch(0.05 0.012 295) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#0a0812",
    sizeMul: 0.85,
    layerCount: [18, 20],
    layerAlphaBase: 0.015,
    layerAlphaVar: 0.012,
    deformInit: 0.16,
    deformLayer: 0.07,
    stretch: [1.5, 0.6],       // stretched along the arm's tangent
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.08,
    dripWidthMul: 0.45,
    threadAlpha: 0.35,
    grain: { base: 255, spread: 0, warm: false, alpha: 60, density: 0.007 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff + 360) % 360;
    const l = 0.64 + Math.sin(seed * 12.9898) * 0.09 - (1 - quality) * 0.07;
    const c = 0.19 + Math.sin(seed * 78.233) * 0.03;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.78 0.18 ${PIGMENT.helpers.pcHue(pc).toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
