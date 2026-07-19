# pigment — agent instructions

Single-file app: everything lives in `index.html`. No build step. Serve with `python3 -m http.server 8477` (mic needs localhost, not file://).

**Before changing any visuals, read `SCORING.md`.** It is the canonical quality rubric and score log for this project. Evaluate with its protocol, log your scores there, and attack the lowest dimension first. Never raise a score without a change that caused it.

Design context: `PRODUCT.md` (what this is, tone, anti-references) and `DESIGN.md` (color system, typography, motion rules). The circle-of-fifths pitch-class → hue mapping is the product's core promise — same chords must always find the same colors. Don't change the mapping casually.

Testing without a microphone: use `window.PIG` (bottom of `index.html`) — `spawnStrike`, `playUrl(url, volume)`, `listen(ms)` (synchronous live-pipeline run, works in throttled tabs), `render(ms)` (synchronous paint simulation). Local test music: `solar-drift-a.wav` / `solar-drift-b.wav` (gitignored; copies from `../mind-movie-maker/assets/music/`).
