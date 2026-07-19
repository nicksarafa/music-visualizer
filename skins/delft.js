/* delft — cobalt on porcelain.
   One pigment, infinite depths: every note is blue, from pale sky-wash
   to deepest kiln cobalt, on cool porcelain white. Gold punctuation,
   like kintsugi, marks where the music paused. */

PIGMENT.registerSkin({
  name: "delft",
  vars: {
    "--paper": "oklch(0.972 0.004 240)",
    "--paper-deep": "oklch(0.948 0.006 240)",
    "--ink": "oklch(0.3 0.07 262)",
    "--ink-soft": "oklch(0.52 0.05 262)",
    "--hairline": "oklch(0.88 0.008 240)",
    "--panel-bg": "oklch(0.972 0.004 240 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.985 0.003 240 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.972 0.004 240) 55%, oklch(0.945 0.007 240) 100%)`,
  },
  params: {
    paperHex: "#f2f4f8",
    granulate: true,
    edgeAlpha: 0.1,
    glossAlpha: 0.2,          // porcelain glaze shine
    dripAlpha: 0.045,
    threadAlpha: 0.28,
    layerAlphaBase: 0.026,
    layerAlphaVar: 0.02,
    deformLayer: 0.04,
    grain: { base: 240, spread: 10, warm: false, alpha: 7, density: 0.35 },
  },
  // one pigment: pitch chooses the depth of the cobalt, minor cools it
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const l = 0.28 + (fifth / 11) * 0.5
            + Math.sin(seed * 12.9898) * 0.05;
    const c = 0.11 + (1 - fifth / 11) * 0.06;
    const hue = 262 + (1 - quality) * 10 + hueOff * 0.15;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.25 0.13 262 / ${alpha.toFixed(3)})`;
  },
  // gold kintsugi beads where drips end and threads anchor
  accent(pc, alpha, seed) {
    return `oklch(0.72 0.13 85 / ${Math.min(1, alpha * 2).toFixed(3)})`;
  },
});
