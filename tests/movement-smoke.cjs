"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");

const ROOT = path.resolve(__dirname, "..");
const MOVEMENTS = ["liquid-bloom", "sacred-rose", "living-sand", "vitruvian-grove"];
const TRACKS = ["solar-drift-a.wav", "solar-drift-b.wav"];

function readWav(file) {
  const data = fs.readFileSync(file);
  let offset = 12;
  let format = null;
  let pcm = null;
  while (offset + 8 <= data.length) {
    const id = data.toString("ascii", offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      format = {
        code: data.readUInt16LE(start),
        channels: data.readUInt16LE(start + 2),
        rate: data.readUInt32LE(start + 4),
        bits: data.readUInt16LE(start + 14),
      };
    } else if (id === "data") {
      pcm = data.subarray(start, start + size);
    }
    offset = start + size + (size & 1);
  }
  if (!format || !pcm || format.code !== 1 || format.bits !== 16) {
    throw new Error(`${path.basename(file)} must be 16-bit PCM WAV`);
  }
  const frameBytes = format.channels * 2;
  const frames = Math.floor(pcm.length / frameBytes);
  return {
    rate: format.rate,
    duration: frames / format.rate,
    sample(frame) {
      const at = Math.max(0, Math.min(frames - 1, frame)) * frameBytes;
      let sum = 0;
      for (let c = 0; c < format.channels; c++) sum += pcm.readInt16LE(at + c * 2) / 32768;
      return sum / format.channels;
    },
  };
}

function goertzel(samples, rate, hz) {
  const omega = 2 * Math.PI * hz / rate;
  const coeff = 2 * Math.cos(omega);
  let q0 = 0, q1 = 0, q2 = 0;
  for (const x of samples) {
    q0 = x + coeff * q1 - q2;
    q2 = q1; q1 = q0;
  }
  return Math.max(0, q1 * q1 + q2 * q2 - coeff * q1 * q2);
}

function musicEvents(file) {
  const wav = readWav(file);
  const size = 4096;
  const events = [];
  for (let event = 0; event < 14; event++) {
    const time = 1.2 + event * 2.35;
    if (time + size / wav.rate >= wav.duration) break;
    const start = Math.floor(time * wav.rate);
    const samples = new Array(size);
    let rms = 0;
    for (let i = 0; i < size; i++) {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
      const x = wav.sample(start + i) * window;
      samples[i] = x; rms += x * x;
    }
    const chroma = new Array(12).fill(0);
    for (let midi = 36; midi <= 88; midi++) {
      const hz = 440 * Math.pow(2, (midi - 69) / 12);
      chroma[midi % 12] += goertzel(samples, wav.rate, hz);
    }
    const ranked = chroma.map((energy, pc) => ({ pc, energy })).sort((a, b) => b.energy - a.energy);
    const pcs = ranked.slice(0, 3).map(({ pc, energy }) => ({ pc, w: Math.sqrt(energy + 1e-9) }));
    events.push({ pcs, level: Math.max(0.24, Math.min(0.96, Math.sqrt(rms / size) * 10)) });
  }
  return events;
}

const drawCounts = { stroke: 0, fill: 0, arc: 0, ellipse: 0, lineTo: 0 };
function fakeGradient() { return { addColorStop() {} }; }
function fakeContext() {
  return {
    beginPath() {}, closePath() {}, moveTo() {},
    lineTo() { drawCounts.lineTo++; },
    stroke() { drawCounts.stroke++; },
    fill() { drawCounts.fill++; },
    arc() { drawCounts.arc++; },
    ellipse() { drawCounts.ellipse++; },
    clearRect() {}, fillRect() {}, drawImage() {}, putImageData() {},
    save() {}, restore() {}, translate() {}, rotate() {}, setLineDash() {},
    createRadialGradient: fakeGradient,
    createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
  };
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.values.has(name) : !!force;
    if (on) this.values.add(name); else this.values.delete(name);
    return on;
  }
}

class FakeElement {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.style = { setProperty() {} };
    this.classList = new FakeClassList();
    this.children = [];
    this.value = "";
    this.textContent = "";
  }
  addEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  querySelector(selector) {
    const match = selector.match(/option\[value="([^"]+)"\]/);
    return match ? this.children.find(child => child.value === match[1]) || null : null;
  }
  click() {}
}

class FakeCanvas extends FakeElement {
  constructor() { super("canvas"); this.width = 0; this.height = 0; this.ctx = fakeContext(); }
  getContext() { return this.ctx; }
  toDataURL() { return "data:image/png;base64,"; }
  captureStream() { return { addTrack() {}, getAudioTracks() { return []; } }; }
}

function engineSandbox() {
  const elements = new Map();
  for (const id of ["paint", "wet", "grain"]) elements.set(id, new FakeCanvas());
  const get = id => {
    if (!elements.has(id)) elements.set(id, new FakeElement());
    return elements.get(id);
  };
  const document = {
    documentElement: new FakeElement("html"),
    body: new FakeElement("body"),
    activeElement: null,
    fullscreenElement: null,
    getElementById: get,
    addEventListener() {},
    createElement(tag) { return tag === "canvas" ? new FakeCanvas() : new FakeElement(tag); },
    exitFullscreen() { return Promise.resolve(); },
  };
  const storage = new Map();
  const sandbox = {
    console, performance, document,
    innerWidth: 640, innerHeight: 360,
    setTimeout, clearTimeout,
    requestAnimationFrame() { return 0; },
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, String(value)); },
    },
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) } },
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.devicePixelRatio = 1;
  sandbox.window.addEventListener = () => {};
  sandbox.window.AudioContext = class {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "engine.js"), "utf8"), sandbox, { filename: "engine.js" });
  return sandbox;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sequences = Object.fromEntries(TRACKS.map(track => [track, musicEvents(path.join(ROOT, track))]));
const sandbox = engineSandbox();
const results = [];

for (const movement of MOVEMENTS) {
  for (const track of TRACKS) {
    sandbox.PIG.setComposition(movement, { keepPaint: true });
    const beforeDraws = { ...drawCounts };
    for (const event of sequences[track]) sandbox.PIG.spawnStrike(event.pcs, event.level);
    const spawned = sandbox.PIG.movementStats();
    sandbox.PIG.render(1800);
    const after = sandbox.PIG.movementStats();
    const strokes = drawCounts.stroke - beforeDraws.stroke;
    const fills = drawCounts.fill - beforeDraws.fill;
    assert(strokes > 0 && fills > 0, `${movement} drew no visible marks for ${track}`);
    if (movement === "liquid-bloom") assert(spawned.liquid > 0, "liquid solver spawned no particles");
    if (movement === "sacred-rose") assert(spawned.gestures >= 8, "sacred rose spawned too little geometry");
    if (movement === "living-sand") assert(spawned.sand > 0, "sand solver spawned no grains");
    if (movement === "vitruvian-grove") assert(after.woodNodes > 0, "wood solver grew no branch nodes");
    results.push({ movement, track, events: sequences[track].length, strokes, fills, spawned, after });
  }
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
