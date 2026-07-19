/* aurelia — an impossible mineral manuscript in daylight.
   Crushed gemstone washes carry mother-of-pearl interference, capillary
   veins, electrum leaf, and wet caustics. Harmony remains the source of
   every body color; the precious-metal notes are punctuation, never noise. */

PIGMENT.registerSkin({
  name: "aurelia",
  vars: {
    "--paper": "oklch(0.945 0.025 80)",
    "--paper-deep": "oklch(0.89 0.038 72)",
    "--ink": "oklch(0.29 0.035 54)",
    "--ink-soft": "oklch(0.51 0.035 58)",
    "--hairline": "oklch(0.79 0.045 76)",
    "--panel-bg": "oklch(0.935 0.028 78 / 0.9)",
    "--bg": `radial-gradient(82% 62% at 48% 8%, oklch(0.985 0.02 88 / 0.94), transparent 66%),
             radial-gradient(115% 105% at 20% 100%, oklch(0.88 0.055 58 / 0.36), transparent 62%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.94 0.028 80) 44%, oklch(0.875 0.042 70) 100%)`,
  },
  params: {
    blend: "multiply",
    paperHex: "oklch(0.945 0.025 80)",
    strokeMode: "nacre",
    sizeMul: 1.08,
    layerCount: [10, 9],
    layerAlphaBase: 0.028,
    layerAlphaVar: 0.021,
    deformInit: 0.062,
    deformDepth: 2,
    deformLayer: 0.018,
    baseVerts: 18,
    stretch: [1.28, 0.48],
    granulate: true,
    edgeAlpha: 0.12,
    glossAlpha: 0.27,
    dripAlpha: 0.058,
    dripWidthMul: 0.68,
    dripBead: true,
    threadAlpha: 0.16,
    threadNodes: true,
    splat: 0.08,
    capillary: 0.86,
    interferenceAlpha: 0.9,
    leafAlpha: 0.76,
    causticAlpha: 0.92,
    movementTraceAlpha: 0.34,
    grain: { base: 222, spread: 30, warm: true, alpha: 14, density: 0.46 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const mineralLight = [0.55, 0.62, 0.7, 0.64, 0.57, 0.61, 0.56, 0.53, 0.58, 0.56, 0.61, 0.57];
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff * 0.17 + Math.sin(seed * 31.7) * 5 + 360) % 360;
    const l = mineralLight[fifth] + Math.sin(seed * 12.9898) * 0.035 + quality * 0.025;
    const c = 0.135 + Math.sin(seed * 78.233) * 0.018 + quality * 0.018;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    const hue = PIGMENT.helpers.pcHue(pc);
    return `oklch(0.37 0.105 ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    const warm = Math.sin(seed * 17.17) > -0.24;
    const hue = warm ? 79 + Math.sin(seed * 9.1) * 7 : 52;
    const l = warm ? 0.72 + Math.sin(seed * 5.7) * 0.055 : 0.61;
    const c = warm ? 0.125 : 0.14;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${Math.min(1, alpha * 1.7).toFixed(3)})`;
  },
  spectral(pc, alpha, seed, phase = 0) {
    const base = PIGMENT.helpers.pcHue(pc);
    const wave = Math.sin(phase * 1.7 + seed * 11.3);
    const overtone = Math.sin(phase * 3.1 - seed * 7.9);
    const hue = (base + wave * 76 + overtone * 24 + 360) % 360;
    const l = 0.69 + Math.sin(phase * 2.3 + seed * 5.1) * 0.075;
    const c = 0.12 + Math.abs(overtone) * 0.045;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${Math.min(1, alpha * 1.25).toFixed(3)})`;
  },
});
