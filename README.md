# pigment

A browser instrument that listens through your microphone and paints what it hears. Sing a note or strike a chord on your guitar and a drop of pigment blooms on a warm paper canvas, then slowly drips down like wet watercolor. The same chords always find the same colors, so over a song the canvas becomes a painting of your harmony.

## Run it

The microphone requires a secure context, so serve it on localhost rather than opening the file directly:

```bash
cd music-visualizer
python3 -m http.server 8477
```

Then open http://localhost:8477 in Chrome, click **begin listening**, and grant the microphone. Or click **or watch the demo** to hear a strummed progression paint by itself.

## Movements and paint

The panel separates **movement** from **paint**. Fourteen center-origin movements decide where and how a phrase crosses the full canvas; the paint dropdown changes its material world. See `ART_DIRECTION.md` for the movement ideas and expression score.

The first four movement choices are matter-driven worlds:

- **liquid bloom** — pressure, viscosity, cohesion, and vortices make neighboring droplets push and braid
- **sacred rose** — pitch chooses the order of an animated star-rosette and its radial construction
- **living sand** — hundreds of colliding grains erupt from the origin, fall, roll, and settle at an angle of repose
- **vitruvian grove** — branching growth tips compete for open space and spread without gravity in every direction

Each paint skin is a small file in `skins/` registered with `PIGMENT.registerSkin()`: palette, paper, blend mode, and physics character.

- **watercolor** — warm linen paper, transparent pooling washes (the original)
- **sumi** — ink wash on rice paper; the only color is the vermilion seal
- **nocturne** — luminous paint on a glossy midnight ground
- **fresco** — earth pigments drying matte into warm plaster
- **cosmos** — nebulae, comet drips, constellation threads, a starfield
- **riso** — four risograph spot inks, flat shapes, misregistration charm
- **delft** — cobalt at infinite depths on porcelain, gold kintsugi beads
- **vitrail** — jewel glass panes held together by lead seams
- **aurora** — vertical curtains of light in an arctic sky
- **spiral** — spectral galaxy pigment, especially suited to slow orbit
- **embers** — coals on char; gravity reversed, sparks climb
- **suminagashi** — floating ink rings, the oldest marbling
- **koi** — rain rippling a jade pond, orange koi flashing beneath
- **meteor** — compact burning heads with trails streaming upward
- **flora** — pressed leaves and blossoms in a herbarium album
- **neon** — hand-bent glowing tubes wired together over wet asphalt
- **colorfield** — broad soak-stain pigment breathing through raw canvas
- **impasto** — dense oil ridges and wet palette-knife marks
- **pointillist** — optical color assembled from separate touches
- **cyanotype** — pale photographic traces developing in Prussian blue
- **ultraviolet** — mineral purple, velvet darkness, and warm metal
- **aurelia** — mother-of-pearl mineral washes, electrum leaf, capillary veins, and wet caustics

Nine of the paints are **living skins** — born in a live AI-conducted residency on 2026-07-23, they carry a real-time sketch layer that runs whenever the paint is selected:

- **lantern pond** — every strike launches a paper boat ferrying its note's flame; koi shadows below; a moonpath opens in stillness
- **storm glass** — strike tides sweep the glass; dense playing draws constellation lightning; sustained loudness makes the field surge
- **electric sheep** — a fractal flame whose genome drifts with flux, mutates on strikes, and takes its symmetry from the chord
- **twin nebula** — one genome, two mirrored dust-nebulae breathing in counterphase, filament-bridged by shared notes
- **garden of forms** — strike-seeded reaction-diffusion chemistry growing dotted rivers and labyrinths
- **shan shui memory** — the session painted as an ink landscape scroll: mountains from loudness, mist in the rests
- **pendulum choir** — every note a harmonograph pendulum at its true interval ratio; consonance closes rosettes, dissonance weaves nets
- **night garden** — strikes germinate trees whose branching comes from the chord's width; blossoms in the triad's colors
- **the flock** — the skin that dreams every other dream: discovers all living skins and cycles their sketches in crossfaded shifts

There is also a **✳ conductor** toggle in the top bar: an optional AI agent (Anthropic API; put a key in a gitignored `conductor.key` beside `index.html`) that listens to the room and re-composes material, movement, and its own generated sketch layer every cycle. The full residency that produced these is replayable from `performances/live-set-2026-07-23.js`.

Keyboard: `c` clear, `s` save, `r` record video (with audio), `f` focus mode (fullscreen, chrome hidden), `h` panel, `[` `]` cycle paints, and `{` `}` cycle movements.

To make a new skin, copy any file in `skins/`, change the name and values, and add a `<script>` tag in `index.html`. See `engine.js` `DEFAULT_PARAMS` for everything a skin can override.

## How it works

- **No build step.** Canvas 2D + Web Audio API. `engine.js` holds analysis, movement, and media rendering; `index.html` holds markup and base styles; `skins/*.js` hold visual identity.
- **Chords → colors.** An 8192-point FFT feeds a chroma vector (energy per pitch class). Hues are assigned around the OKLCH wheel by circle of fifths, so harmonically close chords share a color family and a key change visibly shifts the palette. Major chords paint saturated; minor chords paint softer and cooler.
- **Note onsets** are detected by half-wave-rectified spectral flux with an adaptive threshold (plus a pitch-change trigger for legato singing).
- **Expression score.** Impact, harmonic richness, tonal travel, breath, clarity, and dynamic motion control reach and complexity without assigning value to the song.
- **Movement** begins at the center as a full-frame wavefront and a tapered route. Traveling stains show the color crossing space before the primary bloom arrives.
- **Paint** uses recursive deformed polygons, radial spray gradients, oil-like ridges, stippled dots, or clipped nacre interference depending on the selected skin.
- **Controls** live in a slide-away right panel: source, sensitivity, paint size, bleed, drip, fade, palette rotation, clear, and save (exports the painting as PNG).

Debug/test hooks live on `window.PIG` (spawn strikes programmatically, simulate painting time synchronously, and inspect movement and material state). Run `node tests/movement-smoke.cjs` to drive the four matter systems and Aurelia with pitch-class events extracted from both local evaluation tracks.
