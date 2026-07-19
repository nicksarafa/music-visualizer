/* embers — a fire answering the music.
   Strikes glow like coals on a charred ground, and gravity runs
   backwards: sparks break away and climb into the dark. */

PIGMENT.registerSkin({
  name: "embers",
  vars: {
    "--paper": "oklch(0.14 0.012 45)",
    "--paper-deep": "oklch(0.09 0.01 40)",
    "--ink": "oklch(0.88 0.015 60)",
    "--ink-soft": "oklch(0.6 0.02 55)",
    "--hairline": "oklch(0.28 0.018 50)",
    "--panel-bg": "oklch(0.14 0.012 45 / 0.88)",
    "--bg": `radial-gradient(130% 55% at 50% 112%, oklch(0.22 0.05 45 / 0.85), transparent 60%),
             radial-gradient(150% 130% at 50% 40%, oklch(0.135 0.012 45) 40%, oklch(0.08 0.01 35) 100%)`,
  },
  params: {
    blend: "screen",
    paperHex: "#1b120c",
    gravity: -0.55,            // sparks rise
    layerCount: [14, 16],
    layerAlphaBase: 0.02,
    layerAlphaVar: 0.016,
    deformInit: 0.15,
    deformLayer: 0.06,
    stretch: [1.15, 0.4],
    granulate: true,           // crackle inside the coals
    edgeAlpha: 0,
    glossAlpha: 0,
    dripAlpha: 0.09,
    dripWidthMul: 0.4,         // thin climbing spark trails
    threadAlpha: 0.14,
    grain: { base: 250, spread: 5, warm: true, alpha: 14, density: 0.012 },
  },
  // the fire's gamut: deep coal red through orange to white-hot gold,
  // driven up the fifths wheel
  color(pc, alpha, seed, quality = 1, hueOff = 0) {
    const fifth = (pc * 7) % 12;
    const heat = fifth / 11;                       // 0 coal .. 1 white-hot
    const hue = 28 + heat * 62 + hueOff * 0.2;     // 28 .. 90
    const l = 0.5 + heat * 0.3 + Math.sin(seed * 12.9898) * 0.05 - (1 - quality) * 0.05;
    const c = 0.17 + heat * 0.02;
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)})`;
  },
  edge(pc, alpha) {
    return `oklch(0.75 0.17 60 / ${alpha.toFixed(3)})`;
  },
  accent(pc, alpha, seed) {
    // spark tips flash near-white
    return `oklch(0.9 0.07 85 / ${Math.min(1, alpha * 2.5).toFixed(3)})`;
  },
});
