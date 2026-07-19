# pigment

A browser instrument that listens through your microphone and paints what it hears. Sing a note or strike a chord on your guitar and a drop of pigment blooms on a warm paper canvas, then slowly drips down like wet watercolor. The same chords always find the same colors, so over a song the canvas becomes a painting of your harmony.

## Run it

The microphone requires a secure context, so serve it on localhost rather than opening the file directly:

```bash
cd music-visualizer
python3 -m http.server 8477
```

Then open http://localhost:8477 in Chrome, click **begin listening**, and grant the microphone. Or click **or watch the demo** to hear a strummed progression paint by itself.

## Skins

The panel's **skin** dropdown switches the visual world; the music-to-paint engine underneath never changes. Each skin is a small file in `skins/` registered with `PIGMENT.registerSkin()` — palette, paper, blend mode, and physics character:

- **watercolor** — warm linen paper, transparent pooling washes (the original)
- **sumi** — ink wash on rice paper; the only color is the vermilion seal
- **nocturne** — luminous paint on a glossy midnight ground
- **fresco** — earth pigments drying matte into warm plaster
- **cosmos** — nebulae, comet drips, constellation threads, a starfield
- **riso** — four risograph spot inks, flat shapes, misregistration charm
- **delft** — cobalt at infinite depths on porcelain, gold kintsugi beads
- **vitrail** — jewel glass panes held together by lead seams
- **aurora** — vertical curtains of light in an arctic sky
- **spiral** — a galaxy assembling itself, strikes riding a turning arm
- **embers** — coals on char; gravity reversed, sparks climb
- **suminagashi** — floating ink rings, the oldest marbling
- **koi** — rain rippling a jade pond, orange koi flashing beneath
- **meteor** — a circling shower of burning heads, trails streaming upward
- **flora** — pressed leaves and blossoms in a herbarium album
- **neon** — hand-bent glowing tubes wired together over wet asphalt

The panel shows painted swatch previews of every skin. Keyboard: `c` clear, `s` save, `r` record video (with audio), `f` focus mode (fullscreen, chrome hidden), `h` panel, `[` `]` cycle skins.

To make a new skin, copy any file in `skins/`, change the name and values, and add a `<script>` tag in `index.html`. See `engine.js` `DEFAULT_PARAMS` for everything a skin can override.

## How it works

- **No build step.** Canvas 2D + Web Audio API. `engine.js` holds all logic; `index.html` holds markup and base styles; `skins/*.js` hold visual identity.
- **Chords → colors.** An 8192-point FFT feeds a chroma vector (energy per pitch class). Hues are assigned around the OKLCH wheel by circle of fifths, so harmonically close chords share a color family and a key change visibly shifts the palette. Major chords paint saturated; minor chords paint softer and cooler.
- **Note onsets** are detected by half-wave-rectified spectral flux with an adaptive threshold (plus a pitch-change trigger for legato singing).
- **Watercolor** uses Tyler Hobbs' deformed-polygon technique: dozens of faintly transparent re-deformed layers stacked over ~1.5s, multiply-blended over paper grain, with edge darkening. Heavy drops occasionally break loose and run down with stick-slip gravity, ending in a droplet bead.
- **Controls** live in a slide-away right panel: source, sensitivity, paint size, bleed, drip, fade, palette rotation, clear, and save (exports the painting as PNG).

Debug/test hooks live on `window.PIG` (spawn strikes programmatically, simulate painting time synchronously).
