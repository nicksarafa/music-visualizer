"use strict";

/* ================================================================
   pigment — conductor
   An optional AI agent that listens to the room through the engine's
   analysis (PIGMENT.observe) and re-composes the visuals live: every
   cycle it reads a summary of what it heard, then re-tunes material
   physics by authoring a derived skin, and may change movement or
   base material when the music's character shifts. It never touches
   the pitch-class → hue mapping. Calls the Anthropic API directly
   from the browser with a user-supplied key (stored in localStorage).
   ================================================================ */

(() => {
  const MODEL = "claude-opus-4-8";
  const API_URL = "https://api.anthropic.com/v1/messages";
  const KEY_STORE = "pigment-agent-key";
  const LIVE_SKIN = "✳ conductor";
  const CYCLE_MS = 22000;
  const SAMPLE_MS = 250;
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Params the agent may vary, with clamps applied to whatever it returns.
  const TUNABLE = {
    sizeMul:           { min: 0.4,  max: 2.2 },
    gravity:           { min: -1.5, max: 2.5 },
    splat:             { min: 0,    max: 1 },
    capillary:         { min: 0,    max: 1 },
    glossAlpha:        { min: 0,    max: 0.5 },
    edgeAlpha:         { min: 0,    max: 0.3 },
    dripAlpha:         { min: 0,    max: 0.12 },
    dripWidthMul:      { min: 0.3,  max: 3 },
    threadAlpha:       { min: 0,    max: 0.7 },
    stippleDensity:    { min: 0.3,  max: 3 },
    interferenceAlpha: { min: 0,    max: 0.6 },
    causticAlpha:      { min: 0,    max: 0.6 },
    leafAlpha:         { min: 0,    max: 0.6 },
  };
  const TUNABLE_ENUMS = {
    strokeMode: ["wash", "airbrush", "impasto", "stipple", "nacre"],
    leanMode: ["flow", "vertical"],
  };
  const TUNABLE_BOOLS = ["granulate", "ringed"];

  const state = {
    enabled: false,
    busy: false,
    samples: [],
    history: [],
    cycleTimer: null,
    sampleTimer: null,
    lastDecision: null,
  };

  const el = {
    toggle: document.getElementById("conductorToggle"),
    state: document.getElementById("agentState"),
    note: document.getElementById("agentNote"),
    keyWrap: document.getElementById("agentKeyWrap"),
    key: document.getElementById("agentKey"),
  };

  function baseSkinNames() {
    return Object.keys(PIGMENT.SKINS).filter(n => n !== LIVE_SKIN);
  }

  function buildSchema() {
    const params = {};
    const required = [];
    for (const [k, c] of Object.entries(TUNABLE)) {
      params[k] = { type: "number", description: `${c.min} to ${c.max}` };
      required.push(k);
    }
    for (const [k, values] of Object.entries(TUNABLE_ENUMS)) {
      params[k] = { type: "string", enum: values };
      required.push(k);
    }
    for (const k of TUNABLE_BOOLS) {
      params[k] = { type: "boolean" };
      required.push(k);
    }
    return {
      type: "object",
      additionalProperties: false,
      required: ["comment", "movement", "base_paint", "params"],
      properties: {
        comment: { type: "string", description: "what you heard and did, lowercase, at most 10 words" },
        movement: { type: "string", enum: PIGMENT.COMPOSITIONS.map(c => c.id) },
        base_paint: { type: "string", enum: baseSkinNames() },
        params: { type: "object", additionalProperties: false, required, properties: params },
      },
    };
  }

  function systemPrompt() {
    const movements = PIGMENT.COMPOSITIONS.map(c => `- ${c.id}: ${c.note}`).join("\n");
    const paints = baseSkinNames().join(", ");
    const knobs = Object.entries(TUNABLE).map(([k, c]) => `- ${k} (${c.min}..${c.max})`).join("\n");
    return `You are the conductor inside "pigment", a synesthetic instrument that paints live sound. Pitch classes map to fixed hues (circle of fifths) — that mapping is the product's promise and is not yours to change. What you conduct is everything else: the physics of the paint and the choreography of the movement.

Every cycle you receive a reading of the room — loudness, spectral flux, active notes, strike density, trend — plus your recent decisions. Respond with a complete material specification.

Movements (how music travels from the center):
${movements}

Base paints (visual identities your material derives from): ${paints}

Tunable physics (your spec replaces the base paint's values; numbers are clamped to range):
${knobs}
- strokeMode: wash | airbrush | impasto | stipple | nacre
- leanMode: flow | vertical
- granulate, ringed: booleans

How to conduct:
- Match energy: quiet rooms want small, tight, matte marks; loud energetic rooms can take bold size, splat, drips, caustics.
- Match character: percussive music suits stipple/sand-like textures; sustained harmonic music suits washes, capillaries, nacre.
- Evolve gradually. Change a few params per cycle. Keep movement and base_paint stable unless the music genuinely changes character — switching them clears or disrupts the canvas, so do it at most every few cycles.
- Silence is a statement: when the room goes quiet, let the material settle rather than thrash.
- comment: lowercase, plain, at most 10 words — it is shown in the UI.`;
  }

  /* ---- observation ---- */

  function sample() {
    const o = PIGMENT.observe();
    if (o.source !== "off") state.samples.push(o);
    if (state.samples.length > 400) state.samples.shift();
  }

  function summarize() {
    const s = state.samples;
    if (!s.length) return null;
    const half = Math.floor(s.length / 2);
    const avg = arr => arr.reduce((a, o) => a + o.level, 0) / (arr.length || 1);
    const chroma = new Float32Array(12);
    for (const o of s) for (let i = 0; i < 12; i++) chroma[i] += o.chroma[i];
    let total = 0;
    for (let i = 0; i < 12; i++) total += chroma[i];
    const notes = [...chroma.keys()]
      .map(pc => ({ pc, w: total > 0 ? chroma[pc] / total : 0 }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 4)
      .filter(n => n.w > 0.02)
      .map(n => `${NOTE_NAMES[n.pc]} ${(n.w * 100).toFixed(0)}%`);
    const last = s[s.length - 1];
    return {
      seconds_observed: Math.round(s.length * SAMPLE_MS / 1000),
      loudness_avg: +avg(s).toFixed(3),
      loudness_peak: +Math.max(...s.map(o => o.level)).toFixed(3),
      quiet_ratio: +(s.filter(o => o.level < 0.05).length / s.length).toFixed(2),
      energy_trend: +(avg(s.slice(half)) - avg(s.slice(0, half))).toFixed(3),
      flux_avg: +(s.reduce((a, o) => a + o.flux, 0) / s.length).toFixed(3),
      strikes_last_10s: last.strikesLast10s,
      dominant_notes: notes,
      source: last.source,
      current_movement: last.composition,
      current_paint: last.skin,
    };
  }

  /* ---- decide & apply ---- */

  async function cycle() {
    if (!state.enabled || state.busy) return;
    const observation = summarize();
    state.samples = [];
    if (!observation) {
      setNote("waiting for sound — start the microphone or demo");
      return;
    }
    state.busy = true;
    setState("thinking");
    try {
      const decision = await ask(observation);
      if (!state.enabled) return;
      applyDecision(decision);
      state.history.push({ at: new Date().toISOString(), ...decision });
      if (state.history.length > 3) state.history.shift();
      setState("listening");
      setNote(decision.comment);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem(KEY_STORE);
        disable();
        showKeyInput("that key was rejected — enter a valid Anthropic API key");
      } else if (err.status === 429 || err.status === 529) {
        setState("listening");
        setNote("resting — rate limited, will try again next cycle");
      } else {
        setState("listening");
        setNote(`error: ${err.message || err}`.slice(0, 90));
      }
    } finally {
      state.busy = false;
    }
  }

  async function ask(observation) {
    const user = JSON.stringify({
      observation,
      recent_decisions: state.history.map(h => ({
        comment: h.comment, movement: h.movement, base_paint: h.base_paint,
      })),
    });
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": localStorage.getItem(KEY_STORE) || "",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: [{ type: "text", text: systemPrompt(), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
        output_config: { format: { type: "json_schema", schema: buildSchema() } },
      }),
    });
    if (!res.ok) {
      const err = new Error(`api ${res.status}`);
      try { err.message = (await res.json()).error.message; } catch (e) {}
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (data.stop_reason === "refusal") throw new Error("model declined");
    const text = data.content.find(b => b.type === "text");
    if (!text || data.stop_reason === "max_tokens") throw new Error("incomplete response");
    return JSON.parse(text.text);
  }

  function clampParams(raw) {
    const out = {};
    for (const [k, c] of Object.entries(TUNABLE)) {
      if (typeof raw[k] === "number" && isFinite(raw[k])) {
        out[k] = Math.min(c.max, Math.max(c.min, raw[k]));
      }
    }
    for (const [k, values] of Object.entries(TUNABLE_ENUMS)) {
      if (values.includes(raw[k])) out[k] = raw[k];
    }
    for (const k of TUNABLE_BOOLS) {
      if (typeof raw[k] === "boolean") out[k] = raw[k];
    }
    return out;
  }

  function applyDecision(decision) {
    const base = PIGMENT.SKINS[decision.base_paint];
    if (!base) return;
    const live = {
      ...base,
      name: LIVE_SKIN,
      params: { ...(base.params || {}), ...clampParams(decision.params || {}) },
    };
    // straight into SKINS, not registerSkin — the live skin is the conductor's
    // working material and stays out of the paint dropdown
    PIGMENT.SKINS[LIVE_SKIN] = live;
    PIGMENT.setSkin(LIVE_SKIN, { keepPaint: true });
    // remember the base paint, not the ephemeral live skin, across reloads,
    // and let the paint dropdown show what the material derives from
    try { localStorage.setItem("pigment-skin", decision.base_paint); } catch (e) {}
    const select = document.getElementById("skinSelect");
    if (select) select.value = decision.base_paint;
    if (decision.movement && decision.movement !== PIGMENT.observe().composition) {
      PIGMENT.setComposition(decision.movement, { keepPaint: true });
    }
    state.lastDecision = decision;
  }

  /* ---- ui ---- */

  function setState(text) { el.state.textContent = text; }
  function setNote(text) { el.note.textContent = text; }

  function showKeyInput(message) {
    document.body.classList.add("panel-open");
    el.keyWrap.style.display = "flex";
    setNote(message);
    el.key.focus();
  }

  function enable() {
    if (!localStorage.getItem(KEY_STORE)) {
      showKeyInput("enter your Anthropic API key — stored only in this browser, sent only to anthropic.com");
      return;
    }
    state.enabled = true;
    state.samples = [];
    el.toggle.classList.add("on");
    setState("listening");
    setNote("listening to the room…");
    state.sampleTimer = setInterval(sample, SAMPLE_MS);
    state.cycleTimer = setInterval(cycle, CYCLE_MS);
    setTimeout(() => cycle(), 6000);
  }

  function disable() {
    state.enabled = false;
    clearInterval(state.sampleTimer);
    clearInterval(state.cycleTimer);
    el.toggle.classList.remove("on");
    setState("off");
    setNote("the ✳ button — an ai that listens and re-composes the paint live");
  }

  el.toggle.addEventListener("click", () => (state.enabled ? disable() : enable()));

  el.key.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const v = el.key.value.trim();
    if (!v) return;
    localStorage.setItem(KEY_STORE, v);
    el.key.value = "";
    el.keyWrap.style.display = "none";
    setNote("");
    enable();
  });

  /* debug handle for automated testing (mirrors window.PIG) */
  window.CONDUCTOR = {
    cycle,
    applyDecision,
    summarize,
    state,
    forgetKey() { localStorage.removeItem(KEY_STORE); },
  };
})();
