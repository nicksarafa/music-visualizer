# pigment — agent instructions

No build step. Serve with `python3 -m http.server 8477` (mic needs localhost, not file://).

Architecture: `engine.js` = audio analysis, fourteen center-origin movement systems, paint physics, and UI wiring. `index.html` = markup + base styles + skin script tags. `skins/*.js` = visual identities registered via `PIGMENT.registerSkin({name, vars, params, color?, edge?, accent?})`; chosen from the paint dropdown, persisted in localStorage. Movement is selected independently and persisted as `pigment-composition`. Engine defaults live in `DEFAULT_PARAMS` in `engine.js`; a skin overrides any subset via `params`. Keep engine changes skin-agnostic; keep skin files free of logic. New skin = new file + one script tag.

**Before changing any visuals, read `SCORING.md`.** It is the canonical quality rubric and score log for this project. Evaluate with its protocol, log your scores there, and attack the lowest dimension first. Never raise a score without a change that caused it.

Design context: `PRODUCT.md` (what this is, tone, anti-references) and `DESIGN.md` (color system, typography, motion rules). The circle-of-fifths pitch-class → hue mapping is the product's core promise — same chords must always find the same colors. Don't change the mapping casually.

Testing without a microphone: use `window.PIG` (bottom of `index.html`) — `spawnStrike`, `playUrl(url, volume)`, `listen(ms)` (synchronous live-pipeline run, works in throttled tabs), `render(ms)` (synchronous paint simulation). Local test music: `solar-drift-a.wav` / `solar-drift-b.wav` (gitignored; copies from `../mind-movie-maker/assets/music/`).

Matter-movement smoke test: `node tests/movement-smoke.cjs`. It reads both WAVs, extracts pitch-class events, runs liquid/sacred/sand/wood through the mocked canvas engine, and asserts each solver produces marks and state. This catches runtime regressions but does not replace the screenshot scoring protocol in `SCORING.md`.
