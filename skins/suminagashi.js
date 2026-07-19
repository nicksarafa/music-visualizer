/* suminagashi — ink floating on water.
   The oldest marbling: rings of ink dropped onto a still surface,
   drifting apart in concentric ripples. Every chord is a droplet. */

PIGMENT.registerSkin({
  name: "suminagashi",
  vars: {
    "--paper": "oklch(0.965 0.003 220)",
    "--paper-deep": "oklch(0.945 0.004 220)",
    "--ink": "oklch(0.28 0.01 250)",
    "--ink-soft": "oklch(0.52 0.01 250)",
    "--hairline": "oklch(0.88 0.005 220)",
    "--panel-bg": "oklch(0.965 0.003 220 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.978 0.003 220 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.963 0.003 220) 55%, oklch(0.94 0.005 220) 100%)`,
  },
  params: {
    paperHex: "#f1f2f4",
    ringed: true,
    layerCount: [11, 8],
    layerAlphaBase: 0.05,
    layerAlphaVar: 0.03,
    deformInit: 0.07,
    deformDepth: 3,
    deformLayer: 0.02,
    stretch: [1.05, 0.2],      // droplets stay round on still water
    sizeMul: 1.15,
    granulate: false,
    edgeAlpha: 0,
    glossAlpha: 0.08,
    dripAlpha: 0.05,
    dripWidthMul: 0.5,
    dripBead: false,           // ink tails thin away to nothing
    threadAlpha: 0.2,
    threadNodes: false,
    grain: { base: 240, spread: 8, warm: false, alpha: 6, density: 0.3 },
  },
  // rings alternate: deep sumi ink, pale water-gray, and one quiet color
  // remembered from the note itself
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const roll = Math.sin(seed * 917.3);
    if (roll > 0.35) {
      return `oklch(0.3 0.012 250 / ${alpha.toFixed(3)})`;          // ink
    }
    if (roll > -0.45) {
      return `oklch(0.62 0.008 250 / ${(alpha * 0.8).toFixed(3)})`; // water-gray
    }
    const hue = PIGMENT.helpers.pcHue(pc);
    return `oklch(0.55 0.075 ${hue.toFixed(1)} / ${(alpha * 0.9).toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.3 0.012 250 / ${alpha.toFixed(3)})`;
  },
});
