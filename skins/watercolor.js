/* watercolor — the original pigment skin.
   Warm linen paper in daylight; transparent washes that pool, granulate,
   and drip. The reference against which every other skin is judged. */

PIGMENT.registerSkin({
  name: "watercolor",
  vars: {
    "--paper": "oklch(0.975 0.008 85)",
    "--paper-deep": "oklch(0.955 0.010 85)",
    "--ink": "oklch(0.32 0.015 60)",
    "--ink-soft": "oklch(0.55 0.012 60)",
    "--hairline": "oklch(0.88 0.010 85)",
    "--panel-bg": "oklch(0.975 0.008 85 / 0.92)",
    "--bg": `radial-gradient(120% 90% at 50% -10%, oklch(0.99 0.006 85 / 0.9), transparent 60%),
             radial-gradient(140% 120% at 50% 50%, oklch(0.975 0.008 85) 55%, oklch(0.955 0.010 85) 100%)`,
  },
  params: {},   // engine defaults ARE watercolor
});
