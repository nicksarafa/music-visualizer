# DESIGN.md — Pigment

## Scene sentence

A musician plays guitar at a wooden table in a daylight-lit room, laptop propped open; the screen must feel like a sheet of cold-press watercolor paper lying in that same sunlight. This forces a light theme: warm paper-white, never gray, never dark.

## Color

All color in OKLCH.

### Chrome (Restrained strategy)

- `--paper`: oklch(0.975 0.008 85) — warm linen white, the canvas ground. Never pure #fff.
- `--paper-deep`: oklch(0.955 0.010 85) — vignette edge of the paper.
- `--ink`: oklch(0.32 0.015 60) — warm charcoal for text, never black.
- `--ink-soft`: oklch(0.55 0.012 60) — secondary labels.
- `--hairline`: oklch(0.88 0.010 85) — 1px rules.
- Panel background: paper at 92% opacity over the canvas, backdrop blur is allowed here only because the panel floats over live paint (purposeful, not decorative).

### Pigment (Full palette, carried by the music)

Twelve pitch classes mapped around the OKLCH hue wheel, anchored so keys feel right emotionally (C warm crimson, moving through oranges/golds for D–E, greens for F–G, blues for A, violets for B). Hue = deterministic per pitch class; lightness 0.55–0.75 and chroma 0.11–0.17 jittered slightly per strike so repeated chords feel hand-mixed, not rubber-stamped. Chords blend: each detected pitch class in the chroma vector spawns pigment weighted by its energy, so a C major chord blooms crimson + gold + green that bleed together.

- Loudness → blob size and initial wetness, never → brightness flashing.
- Background stays paper; pigment multiplies over it like real watercolor (`multiply` blend), edges darken slightly (watercolor edge effect).

## Typography

- UI face: "Sorts Mill Goudy" (Google Fonts, italic for the wordmark) — reads like a letterpress watercolor-tube label, not a magazine. Georgia/serif fallback. (Newsreader was the reflex pick; rejected per brand reference.)
- Controls: 13px/1.4 system-ui at weight 450; labels lowercase.
- Wordmark "pigment" 20px Sorts Mill Goudy italic, ink color, top-left, fades to 25% opacity when idle.
- Scale contrast ≥1.4 between wordmark and labels; hierarchy via weight + size, never color alone.

## Layout

- Full-viewport canvas. No container, no card around the painting.
- Right side: a single slim panel (280px) that slides fully off-screen; toggled by a small circular button. Panel content is a flat list of labeled sliders separated by generous whitespace (32px groups), one hairline between sections, no cards, no headers-in-boxes.
- Bottom-left: transient status line ("listening…", detected note names as quiet text) that fades out after 2s of silence.

## Motion

- Everything eases out (cubic-bezier(0.16, 1, 0.3, 1), 400–600ms) for UI; paint physics run on their own clock (blooms ~1.5s, drips 4–10s).
- No bounce, no elastic, no pulsing-to-beat. The only fast motion is the birth of a bloom (first 120ms).
- Panel slide: 450ms ease-out-expo.

## Components

- Slider: 2px hairline track, 14px round ink thumb with the current pigment hue as a 3px ring when the slider affects color. No tick marks.
- Toggle: small text button, ink color, underline on hover. No pill switches.
- Buttons: text-only or 32px circular icon buttons with hairline border.

## Texture & gloss

- Paper: subtle procedural grain (2–3% luminance noise, generated once to an offscreen canvas) + a very soft radial sheen from top-center to suggest gloss, ≤4% opacity. The "glossy" ask is satisfied by sheen + wet-paint specular on fresh blobs, not by glassmorphism.
- Fresh pigment renders slightly darker and more saturated ("wet"), drying to its final value over ~8s.
