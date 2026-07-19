/* cosmos — looking into the infinite.
   Chords bloom as nebulae against deep space; drips fall as thin comet
   trails; threads draw constellations between what the music has made.
   A sparse starfield waits underneath. */

PIGMENT.registerSkin({
  name: "cosmos",
  vars: {
    "--paper": "oklch(0.11 0.02 300)",
    "--paper-deep": "oklch(0.07 0.015 310)",
    "--ink": "oklch(0.9 0.01 300)",
    "--ink-soft": "oklch(0.62 0.015 300)",
    "--hairline": "oklch(0.28 0.02 300)",
    "--panel-bg": "oklch(0.12 0.02 300 / 0.85)",
    "--bg": `radial-gradient(100% 80% at 70% 15%, oklch(0.16 0.035 290 / 0.8), transparent 55%),
             radial-gradient(120% 100% at 25% 80%, oklch(0.13 0.03 250 / 0.7), transparent 60%),
             radial-gradient(150% 130% at 50% 50%, oklch(0.105 0.02 300) 40%, oklch(0.06 0.014 315) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#0b0714",
    sizeMul: 1.1,
    layerCount: [22, 26],
    layerAlphaBase: 0.012,
    layerAlphaVar: 0.010,
    deformInit: 0.2,
    deformLayer: 0.09,
    stretch: [1.35, 0.7],
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.10,
    dripWidthMul: 0.5,
    dripBead: true,
    threadAlpha: 0.4,
    threadNodes: true,
    grain: { base: 255, spread: 0, warm: false, alpha: 65, density: 0.008 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff + 360) % 360;
    const l = 0.62 + Math.sin(seed * 12.9898) * 0.10 - (1 - quality) * 0.08;
    const c = 0.20 + Math.sin(seed * 78.233) * 0.03;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.75 0.2 ${PIGMENT.helpers.pcHue(pc).toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
