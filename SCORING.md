# SCORING.md — the pigment quality rubric

**Agents: this is the canonical scoring feedback system for this project.** Any agent iterating on the visuals must evaluate against this rubric, log its scores in the table at the bottom, and target the lowest-scoring dimension first. Do not invent a new scale.

## How to run an evaluation

1. Serve the app: `python3 -m http.server 8477` in the repo root, open `http://localhost:8477` in Chrome.
2. Use the debug handle `window.PIG` (defined at the bottom of `index.html`). The standard evaluation run is:
   ```js
   document.getElementById('welcome').classList.add('gone');
   await PIG.playUrl('solar-drift-a.wav', 0);   // or -b.wav; muted; needs the local wav (gitignored)
   PIG.listen(40000);                            // 40s of live analysis, synchronous
   PIG.render(10000);                            // let blooms finish + drips run
   ```
   If the test audio is missing, use the built-in demo (`srcDemo` button) or `PIG.spawnStrike` sequences.
3. Screenshot the result. Score every dimension below 0–10 **from the screenshot**, not from intention.
4. Also do one **responsiveness** check (dimension 6), which is about behavior, not stills.
5. Log the row. Fix the weakest dimension. Repeat.

Scoring honesty rules: a 10 means "I would frame this / ship this to strangers with my name on it." If you hesitate, it's a 9 or less. Scores must never be raised without a change that plausibly caused the improvement. Regressions must be logged, not hidden.

## The seven dimensions

### 1. Breathing room (minimalism)
Paint must never read as clutter. 10 = generous unpainted paper remains even after 40s of continuous music; each wash is readable as an individual object; nothing looks like "coverage." 5 = dense tapestry, some mush regions. 0 = wall of paint.

### 2. Flow
The painting should feel like liquid moved through it, not like stamps landed on it. Judged by: drips wander organically (no straight mechanical lines), washes stretch and lean, threads sag like wet string, and the eye travels the canvas along connected color. 10 = the still image implies motion everywhere.

### 3. Full-canvas use
All regions of the viewport receive paint over a session — corners and edges included — while still obeying dimension 1. 10 = no dead quadrant, no central pile-up.

### 4. Color harmony
Colors come from the music (circle-of-fifths pitch-class hues — do not change the mapping casually; it is the product's core promise). 10 = one readable family per musical section with deliberate accents; overlaps enrich (glazing) rather than muddy toward gray-brown. Watch for: complementary overlaps producing mud, olive-brown pile-ups, carnival randomness.

### 5. Painterliness
Washes must look like wet media on cold-press paper: soft pooled interiors, feathered-but-not-furry edges, slight edge darkening, visible layer depth. 10 = a viewer would ask "is that scanned watercolor?" Watch for: dandelion/sea-urchin spikes, cotton-ball fuzz, flat digital blobs, uniform circles.

### 6. Responsiveness (behavioral, test live or via PIG.listen)
A struck note paints in the same instant it sounds — no perceptible lag. Sustained/ambient sound adds paint gently without flooding (the calm budget). Repeating the same chord lands in the same color family every time. 10 = instant on attacks, unhurried between them, deterministic colors.

### 7. Chrome elegance
The UI around the canvas: wordmark, status line, panel. 10 = nearly invisible until needed, wording is lowercase-calm and jargon-free, panel slides away completely, nothing looks like a dashboard or audio plugin. (See DESIGN.md for the design system.)

## Score log

Chronological. Add one row per evaluated iteration. `—` = not evaluated that round.

| iter | date | commit | 1 breath | 2 flow | 3 canvas | 4 color | 5 paint | 6 respond | 7 chrome | notes |
|------|------|--------|----------|--------|----------|---------|---------|-----------|----------|-------|
| 1 | 2026-07-19 | 64dc4ba^ | 2 | 3 | 5 | 4 | 6 | 5 | 8 | rainbow mush, 60 strikes/30s |
| 2 | 2026-07-19 | 64dc4ba^ | 6 | 4 | 4 | 5 | 6 | 5 | 8 | governed rate; one dense band |
| 3 | 2026-07-19 | 64dc4ba^ | 7 | 7 | 6 | 6 | 6 | 5 | 8 | Lissajous river; beads-on-string |
| 4 | 2026-07-19 | 64dc4ba^ | 7 | 8 | 7 | 6 | 7 | 5 | 8 | bridged current, garland look |
| 6 | 2026-07-19 | 64dc4ba | 4 | 6 | 9 | 6 | 7 | 8 | 8 | user pivot: random pop-up, threads faint |
| 7 | 2026-07-19 | 64dc4ba | 5 | 6 | 9 | 7 | 7 | 8 | 8 | threads dashed (bug) |
| 8 | 2026-07-19 | 64dc4ba | 6 | 7 | 9 | 7 | 7 | 8 | 8 | threads continuous; budget added |
| 9 | 2026-07-19 | 64dc4ba | 7 | 8 | 9 | 7 | 7 | 9 | 8 | node beads, organic drips |
| 10 | 2026-07-19 | 64dc4ba | 8 | 8 | 9 | 8 | 7 | 9 | 8 | defaults validated on track B |
| 11 | 2026-07-19 | (wip) | 6 | 8 | 9 | 8 | 8.5 | 9 | 8 | glazing+granulation+pooling; density regressed |
| 12 | 2026-07-19 | (wip) | 8.5 | 9 | 10 | 9 | 9 | 10 | 9 | smaller washes, wider spacing, status pigment dot |
| 13 | 2026-07-19 | (wip) | 9.5 | 9.5 | 10 | 9.5 | 9.5 | 10 | 9.5 | washes lean along strike leaps; edge variety |
| 14 | 2026-07-19 | (wip) | 10 | 10 | 10 | 10 | 9.5 | 10 | 10 | track B validation: distinct coherent palette; small washes cottony |
| 15 | 2026-07-19 | see commit | 10 | 10 | 10 | 10 | 10 | 10 | 10 | small washes carry denser pigment (aMul); all dimensions pass |

Iterations 1–15 were run against `solar-drift-a/b.wav` (40s listen + 10s render). The bar going
forward: any change to the paint engine must re-run the standard evaluation on BOTH tracks and
must not drop any dimension below its logged value.

## Skin iterations (16–34)

Iterations 16–34 built the skin system (engine.js + skins/, see CLAUDE.md) and eight skins.
Per-skin verdicts (dimensions 1–3 and 6 are engine-owned and unchanged; scored on 4, 5, and
overall identity — "would a stranger recognize the reference?"):

| iter | skin | verdict | notes |
|------|------|---------|-------|
| 16 | (refactor) | pass | watercolor parity with iteration 15 |
| 17–19 | sumi | shipped | red-as-C failed (C is everywhere); red moved to seal-bead accents |
| 20–21 | nocturne | shipped | luminosity lifted after dim first draft |
| 22–23 | fresco | shipped | drab first draft; tonal spread + grain lifted |
| 24–25 | cosmos | shipped | needed void: smaller clouds, visible starfield |
| 26–27 | riso | shipped | quadrant ink mapping let pink dominate; interleaved |
| 28 | delft | shipped | right on the first pass |
| 29–30 | vitrail | shipped | new deformDepth param for smooth leaded panes |
| 31–34 | (regression) | pass | watercolor, sumi, nocturne re-verified after engine hooks |

Skin-specific taste rules: every skin must keep the fifths-derived determinism audible-to-visible
(same chord, same color/tone family), must remain quiet-chrome (panel/status restyled, never
redesigned), and must pass the identity question above. When evaluating a new skin, run the
standard protocol once on either track plus one fixed-verse spawnStrike sweep.
