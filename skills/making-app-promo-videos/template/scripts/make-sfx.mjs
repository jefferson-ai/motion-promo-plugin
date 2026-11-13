// Creates the video's sound effects from scratch (no downloads): run `npm run sfx`.
// Each sound is built from simple waves and noise, then saved as a .wav file in public/sfx/.
import { writeFileSync, mkdirSync } from "node:fs";

const RATE = 44100;
const out = new URL("../public/sfx/", import.meta.url);
mkdirSync(out, { recursive: true });

// A fixed "random" sequence, so the files come out identical every time.
let seed = 12345;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => random() * 2 - 1;

const buffer = (seconds) => new Float32Array(Math.round(seconds * RATE));

/** Adds a tone to `buf` starting at `at` seconds. `freq` can change over time; `decay` is how fast it dies away. */
const tone = (buf, { at = 0, length, freq, freqEnd = freq, decay, gain = 1, attack = 0.003 }) => {
  let phase = 0;
  const start = Math.round(at * RATE);
  for (let i = 0; i < length * RATE && start + i < buf.length; i++) {
    const t = i / RATE;
    const f = freq + (freqEnd - freq) * Math.min(1, t / length);
    phase += (2 * Math.PI * f) / RATE;
    buf[start + i] += Math.sin(phase) * Math.min(1, t / attack) * Math.exp(-t / decay) * gain;
  }
};

/** Adds a burst of hiss. `cutoff(t)` (in Hz) shapes how bright it is; `shape(t)` is its loudness over time. */
const hiss = (buf, { at = 0, length, cutoff, shape, gain = 1 }) => {
  let low = 0;
  const start = Math.round(at * RATE);
  for (let i = 0; i < length * RATE && start + i < buf.length; i++) {
    const t = i / RATE;
    low += (1 - Math.exp((-2 * Math.PI * cutoff(t / length)) / RATE)) * (noise() - low);
    buf[start + i] += low * shape(t / length) * gain;
  }
};

const save = (name, buf, peak = 0.8) => {
  const loudest = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const data = Buffer.alloc(44 + buf.length * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + buf.length * 2, 4); data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(buf.length * 2, 40);
  buf.forEach((v, i) => data.writeInt16LE(Math.round((v / loudest) * peak * 32767), 44 + i * 2));
  writeFileSync(new URL(`${name}.wav`, out), data);
  console.log(`${name}.wav  ${(buf.length / RATE).toFixed(2)}s`);
};

// Pop: something appears.
{ const b = buffer(0.2); tone(b, { length: 0.18, freq: 320, freqEnd: 760, decay: 0.045 }); save("pop", b); }

// Tap: a finger pressing something on screen.
{
  const b = buffer(0.25);
  tone(b, { length: 0.22, freq: 170, freqEnd: 70, decay: 0.06 });
  hiss(b, { length: 0.012, cutoff: () => 4000, shape: (p) => 1 - p, gain: 0.5 });
  save("tap", b);
}

// Whoosh: a quick sweep for movement between scenes.
{
  // Smooth version: the hiss goes through three soft filters in a row (so the gritty high part is removed),
  // stays lower in pitch, and swells and fades slowly like moving air.
  const length = 0.65;
  const b = buffer(length);
  const stage = [0, 0, 0];
  for (let i = 0; i < b.length; i++) {
    const p = i / b.length;
    const swell = Math.sin(Math.PI * p) ** 2;
    const k = 1 - Math.exp((-2 * Math.PI * (180 + 1100 * swell)) / RATE);
    let x = noise();
    for (let s = 0; s < 3; s++) x = stage[s] += k * (x - stage[s]);
    b[i] = x * swell ** 1.5;
  }
  save("whoosh", b, 0.7);
}

// Three rising blips: the product "reading" or counting something.
[660, 880, 1100].forEach((freq, i) => {
  const b = buffer(0.2);
  tone(b, { length: 0.18, freq, decay: 0.05 });
  tone(b, { length: 0.18, freq: freq * 2, decay: 0.03, gain: 0.25 });
  save(`blip${i + 1}`, b, 0.6);
});

// Ding: something is done / saved.
{
  const b = buffer(1.0);
  tone(b, { length: 1, freq: 1046.5, decay: 0.28 });
  tone(b, { length: 1, freq: 1568, decay: 0.22, gain: 0.6 });
  tone(b, { length: 1, freq: 2093, decay: 0.12, gain: 0.25 });
  save("ding", b);
}

// Impact: a hard cut to a dark punch line ("Even better?").
{
  const b = buffer(0.8);
  tone(b, { length: 0.8, freq: 95, freqEnd: 42, decay: 0.22 });
  hiss(b, { length: 0.15, cutoff: () => 700, shape: (p) => (1 - p) ** 2, gain: 0.8 });
  save("impact", b, 0.9);
}

// Drain: a number spinning down.
{
  const b = buffer(1.6);
  for (let i = 0; i < 22; i++) {
    const p = i / 21;
    tone(b, { at: 1.45 * p ** 0.8, length: 0.08, freq: 1200 - 850 * p, decay: 0.025, gain: 0.9 - 0.4 * p });
  }
  save("drain", b, 0.6);
}

// Chord: the product name at the end (four bell notes, one after another).
{
  const b = buffer(1.8);
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(b, { at: i * 0.07, length: 1.5, freq, decay: 0.45, gain: 0.8 });
    tone(b, { at: i * 0.07, length: 1.5, freq: freq * 2, decay: 0.2, gain: 0.2 });
  });
  save("chord", b);
}
