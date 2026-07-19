/* pointillist — optical color assembled from separate touches.
   Notes remain tiny decisions until distance and time blend them into
   luminous fields, a painting completed inside the viewer's eye. */

PIGMENT.registerSkin({
  name: "pointillist",
  vars: {
    "--paper": "oklch(0.965 0.016 96)",
    "--paper-deep": "oklch(0.935 0.02 92)",
    "--ink": "oklch(0.3 0.04 245)",
    "--ink-soft": "oklch(0.53 0.035 245)",
    "--hairline": "oklch(0.85 0.02 94)",
    "--panel-bg": "oklch(0.965 0.016 96 / 0.92)",
    "--bg": `radial-gradient(125% 92% at 50% -8%, oklch(0.985 0.012 100 / 0.9), transparent 58%),
             radial-gradient(145% 125% at 50% 52%, oklch(0.962 0.016 96) 52%, oklch(0.93 0.022 90) 100%)`,
  },
  params: {
    paperHex: "#f1edda",
    strokeMode: "stipple",
    stippleDensity: 3.15,
    sizeMul: 1.15,
    layerCount: [9, 7],
    layerAlphaBase: 0.05,
    layerAlphaVar: 0.022,
    deformInit: 0.04,
    deformDepth: 2,
    deformLayer: 0.012,
    stretch: [1.15, 0.35],
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.025,
    dripWidthMul: 0.42,
    dripBead: false,
    threadAlpha: 0.22,
    threadNodes: true,
    grain: { base: 235, spread: 14, warm: true, alpha: 9, density: 0.42 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff * 0.35 + 360) % 360;
    const l = 0.56 + Math.sin(seed * 12.9898) * 0.11 + quality * 0.05;
    const c = 0.17 + Math.sin(seed * 78.233) * 0.025;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    return `oklch(0.42 0.11 ${PIGMENT.helpers.pcHue(pc).toFixed(1)} / ${Math.min(1, alpha * 1.5).toFixed(3)})`;
  },
});
