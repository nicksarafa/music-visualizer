# pigment

A browser instrument that listens through your microphone and paints what it hears. Sing a note or strike a chord on your guitar and a drop of pigment blooms on a warm paper canvas, then slowly drips down like wet watercolor. The same chords always find the same colors, so over a song the canvas becomes a painting of your harmony.

## Run it

The microphone requires a secure context, so serve it on localhost rather than opening the file directly:

```bash
cd music-visualizer
python3 -m http.server 8477
```

Then open http://localhost:8477 in Chrome, click **begin listening**, and grant the microphone. Or click **or watch the demo** to hear a strummed progression paint by itself.

## How it works

- **One HTML file, no build step.** Canvas 2D, Web Audio API, ~700 lines.
- **Chords → colors.** An 8192-point FFT feeds a chroma vector (energy per pitch class). Hues are assigned around the OKLCH wheel by circle of fifths, so harmonically close chords share a color family and a key change visibly shifts the palette. Major chords paint saturated; minor chords paint softer and cooler.
- **Note onsets** are detected by half-wave-rectified spectral flux with an adaptive threshold (plus a pitch-change trigger for legato singing).
- **Watercolor** uses Tyler Hobbs' deformed-polygon technique: dozens of faintly transparent re-deformed layers stacked over ~1.5s, multiply-blended over paper grain, with edge darkening. Heavy drops occasionally break loose and run down with stick-slip gravity, ending in a droplet bead.
- **Controls** live in a slide-away right panel: source, sensitivity, paint size, bleed, drip, fade, palette rotation, clear, and save (exports the painting as PNG).

Debug/test hooks live on `window.PIG` (spawn strikes programmatically, simulate painting time synchronously).
