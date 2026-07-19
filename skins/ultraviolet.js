/* ultraviolet — velvet darkness, mineral purple, and warm metal.
   The palette carries theatrical confidence while the movement keeps
   an intimate center, built for a room that wants both hush and release. */

PIGMENT.registerSkin({
  name: "ultraviolet",
  vars: {
    "--paper": "oklch(0.16 0.055 315)",
    "--paper-deep": "oklch(0.09 0.035 325)",
    "--ink": "oklch(0.9 0.025 92)",
    "--ink-soft": "oklch(0.65 0.025 315)",
    "--hairline": "oklch(0.32 0.05 315)",
    "--panel-bg": "oklch(0.15 0.052 318 / 0.88)",
    "--bg": `radial-gradient(90% 75% at 50% 48%, oklch(0.22 0.075 310 / 0.82), transparent 64%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.15 0.052 318) 42%, oklch(0.075 0.03 330) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#190d22",
    strokeMode: "impasto",
    sizeMul: 0.92,
    layerCount: [8, 7],
    layerAlphaBase: 0.04,
    layerAlphaVar: 0.024,
    deformInit: 0.08,
    deformDepth: 2,
    deformLayer: 0.022,
    stretch: [1.55, 0.7],
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.2,
    dripAlpha: 0.085,
    dripWidthMul: 0.7,
    threadAlpha: 0.44,
    threadNodes: true,
    splat: 0.18,
    grain: { base: 230, spread: 25, warm: false, alpha: 9, density: 0.09 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const tones = [
      [0.69, 0.19, 308], [0.75, 0.16, 92], [0.63, 0.2, 338],
      [0.72, 0.15, 265], [0.78, 0.13, 65], [0.66, 0.18, 292],
    ];
    const [l, c, h] = tones[fifth % tones.length];
    const lj = l + Math.sin(seed * 12.9898) * 0.055 - (1 - quality) * 0.045;
    return `oklch(${lj.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    return `oklch(0.82 0.14 88 / ${Math.min(1, alpha * 2.2).toFixed(3)})`;
  },
});
