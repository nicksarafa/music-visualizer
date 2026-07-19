# PRODUCT.md — Pigment

## What it is

Pigment is a browser-based instrument that listens through the microphone and paints what it hears. Sing a note or strike a chord on a guitar and a drop of pigment blooms on a light canvas, then slowly drips downward like wet watercolor. The same chord always produces the same color family, so over a song the canvas becomes a painting of the harmony you played. It is a single-page local web app, no backend, no accounts.

## Register

brand

Design IS the product here. The canvas is the artwork; the UI chrome exists only to serve the painting and must nearly disappear.

## Users

One person: a musician at home. They sit at a wooden table in a daylight-lit room, guitar in lap or singing, laptop open, and play for the joy of watching color answer sound. Sometimes they screen-share it with friends or project it at a small gathering ("share some musical love"). No onboarding funnel, no metrics, no growth loops.

## Product purpose

- Turn live musical input (voice, guitar chords) into slow, elegant paint drips on a glossy light canvas.
- Deterministic color: pitch class → hue. The same chord always lands in the same color family, so harmony becomes a visible palette. Position on canvas is random/organic; color is not.
- Give the player a quiet right-side panel of controls (sensitivity, drip behavior, paint size, fade, palette rotation, input source, demo mode) that can be hidden entirely.
- Feel like an art object, not a tech demo. Elegant, restrained, "nothing too overpowering."

## Tone

Warm, unhurried, painterly. The app should feel like a sunlit studio: linen-white canvas, wet pigment, slow gravity. Words in the UI are few, lowercase-calm, never jargon ("sensitivity", "drip", "fade" — not "FFT gain").

## Anti-references

- Winamp/Milkdrop neon spectrum bars, oscilloscopes, EDM strobe visualizers. Nothing pulsing to a beat grid.
- Black-background cyber aesthetics, neon-on-dark, glow bloom everywhere.
- Dashboard chrome: cards, panels with headers, badges, stat tiles.
- Anything that reads "audio plugin UI" (knob skeuomorphism, LED meters).

## Strategic principles

1. The painting is the hero. Every pixel of chrome must justify itself against a blank canvas.
2. Slow is beautiful. Drips render out over seconds, not frames. Restraint over spectacle.
3. Deterministic harmony→color, organic everything else (position, drip path, bloom shape).
4. Works instantly: open the file, grant the mic, play. A built-in demo mode plays synthetic chords so the visual can be experienced (and tested) without a mic.
5. Runs at 60fps on a MacBook in Canvas 2D; no build step, one HTML file.
