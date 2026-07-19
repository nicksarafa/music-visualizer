/* neon — signs in the rain.
   Every chord bends a glass tube and fills it with gas: glowing
   outlines over wet asphalt dark, wired together with thin cable. */

PIGMENT.registerSkin({
  name: "neon",
  vars: {
    "--paper": "oklch(0.15 0.008 270)",
    "--paper-deep": "oklch(0.1 0.006 280)",
    "--ink": "oklch(0.9 0.01 270)",
    "--ink-soft": "oklch(0.62 0.012 270)",
    "--hairline": "oklch(0.3 0.012 270)",
    "--panel-bg": "oklch(0.15 0.008 270 / 0.88)",
    "--bg": `radial-gradient(130% 60% at 50% 112%, oklch(0.2 0.02 280 / 0.7), transparent 55%),
             radial-gradient(150% 130% at 50% 40%, oklch(0.145 0.008 270) 40%, oklch(0.09 0.006 285) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#17161f",
    ringed: true,              // tubes, not fills
    layerCount: [8, 6],
    layerAlphaBase: 0.075,
    layerAlphaVar: 0.045,
    deformInit: 0.06,
    deformDepth: 2,
    deformLayer: 0.015,
    stretch: [1.3, 0.5],
    sizeMul: 0.95,
    splat: 0.25,               // stray sparks off the transformer
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.12,          // rain sheen
    dripAlpha: 0.09,           // reflections running down the wet street
    dripWidthMul: 0.6,
    threadAlpha: 0.4,          // the wiring
    grain: { base: 220, spread: 30, warm: false, alpha: 8, density: 0.05 },
  },
  // gas colors: neon red-orange, argon lavender, mercury blue, helium
  // gold, interleaved around the fifths so signs mix on every block
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const GASES = [
      [0.7, 0.21, 25],     // neon proper: hot red-orange
      [0.75, 0.13, 300],   // argon lavender
      [0.72, 0.16, 235],   // mercury blue
      [0.82, 0.15, 95],    // helium gold
    ];
    const [l, c, h] = GASES[((pc * 7) % 12) % 4];
    const lj = l + Math.sin(seed * 12.9898) * 0.04 - (1 - quality) * 0.06;
    return `oklch(${lj.toFixed(3)} ${c} ${h} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.85 0.1 25 / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    return `oklch(0.9 0.06 95 / ${Math.min(1, alpha * 2.2).toFixed(3)})`;
  },
});
