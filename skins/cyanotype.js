/* cyanotype — music exposing a photographic field.
   Pale mineral traces develop inside Prussian blue as if the song
   had been laid on sensitized paper and carried into sunlight. */

PIGMENT.registerSkin({
  name: "cyanotype",
  vars: {
    "--paper": "oklch(0.28 0.09 248)",
    "--paper-deep": "oklch(0.18 0.075 252)",
    "--ink": "oklch(0.91 0.025 220)",
    "--ink-soft": "oklch(0.69 0.035 225)",
    "--hairline": "oklch(0.42 0.07 245)",
    "--panel-bg": "oklch(0.25 0.085 250 / 0.89)",
    "--bg": `radial-gradient(110% 80% at 45% 8%, oklch(0.35 0.1 242 / 0.78), transparent 60%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.265 0.09 248) 42%, oklch(0.16 0.07 255) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#10386d",
    strokeMode: "airbrush",
    sizeMul: 1.35,
    layerCount: [15, 18],
    layerAlphaBase: 0.015,
    layerAlphaVar: 0.012,
    deformInit: 0.09,
    deformDepth: 3,
    deformLayer: 0.045,
    stretch: [1.35, 0.6],
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.08,
    dripAlpha: 0.055,
    dripWidthMul: 0.55,
    threadAlpha: 0.32,
    threadNodes: false,
    grain: { base: 210, spread: 35, warm: false, alpha: 13, density: 0.38 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const hue = 205 + (fifth / 11) * 62 + hueOff * 0.08;
    const l = 0.72 + (fifth / 11) * 0.16 + Math.sin(seed * 12.9898) * 0.045;
    const c = 0.055 + (1 - quality) * 0.018;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
