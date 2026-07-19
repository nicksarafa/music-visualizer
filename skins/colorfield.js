/* colorfield — soak-stain pigment breathing through raw canvas.
   Broad, unbordered color carries the harmony without a fixed focal
   point; the movement system gives those quiet fields their direction. */

PIGMENT.registerSkin({
  name: "colorfield",
  vars: {
    "--paper": "oklch(0.955 0.014 78)",
    "--paper-deep": "oklch(0.925 0.018 74)",
    "--ink": "oklch(0.31 0.025 54)",
    "--ink-soft": "oklch(0.54 0.022 56)",
    "--hairline": "oklch(0.84 0.018 76)",
    "--panel-bg": "oklch(0.955 0.014 78 / 0.91)",
    "--bg": `radial-gradient(120% 90% at 50% -8%, oklch(0.975 0.012 82 / 0.9), transparent 58%),
             radial-gradient(150% 130% at 50% 55%, oklch(0.952 0.014 78) 48%, oklch(0.918 0.02 72) 100%)`,
  },
  params: {
    paperHex: "#efe6d6",
    strokeMode: "wash",
    sizeMul: 1.75,
    layerCount: [18, 20],
    layerAlphaBase: 0.009,
    layerAlphaVar: 0.007,
    deformInit: 0.075,
    deformDepth: 2,
    deformLayer: 0.022,
    stretch: [1.5, 0.8],
    granulate: true,
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.012,
    dripWidthMul: 1.4,
    threadAlpha: 0.11,
    threadNodes: false,
    grain: { base: 230, spread: 22, warm: true, alpha: 15, density: 0.58 },
  },
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const hue = (PIGMENT.helpers.pcHue(pc) + hueOff * 0.45 + 360) % 360;
    const sun = 0.5 + 0.5 * Math.sin((hue - 35) * Math.PI / 180);
    const l = 0.61 + sun * 0.12 + Math.sin(seed * 12.9898) * 0.045;
    const c = (0.105 + Math.sin(seed * 78.233) * 0.016) * (0.82 + quality * 0.18);
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
});
