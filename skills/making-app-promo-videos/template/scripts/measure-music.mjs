// Measures a song so the video can be cut to it: `npm run measure -- public/music/song.m4a [seconds]`
// Prints: loudness every half second (whole mix and bass below ~120 Hz), the DROP (where the level jumps, to 10 ms),
// the bar length (how often the bass pattern repeats), the beat (bar ÷ 4), and the first bass hits after the drop.
// Copy `drop` and `beat` into MUSIC in src/plan.ts.
// The AI cannot hear: these numbers are what it uses instead. The person still judges the song by ear.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const input = process.argv[2];
const seconds = Number(process.argv[3] ?? 70);
if (!input) {
  console.error("usage: npm run measure -- <song file> [seconds to analyse, default 70]");
  process.exit(1);
}

// 1. Decode the start of the song to mono 22 kHz wav with Remotion's bundled ffmpeg.
const RATE = 22050;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "measure-"));
const wav = path.join(tmp, "song.wav");
execFileSync("npx", ["remotion", "ffmpeg", "-v", "error", "-y", "-i", input, "-t", String(seconds), "-ac", "1", "-ar", String(RATE), "-acodec", "pcm_s16le", wav]);
const buf = fs.readFileSync(wav);
fs.rmSync(tmp, { recursive: true, force: true });
const dataAt = buf.indexOf("data") + 8;
const samples = new Float32Array((buf.length - dataAt) >> 1);
for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(dataAt + i * 2) / 32768;

// 2. A bass-only copy: two gentle low-pass filters in a row (~120 Hz).
const k = 1 - Math.exp((-2 * Math.PI * 120) / RATE);
const bass = new Float32Array(samples.length);
let a = 0, b = 0;
for (let i = 0; i < samples.length; i++) { a += k * (samples[i] - a); b += k * (a - b); bass[i] = b; }

// 3. Energy in 10 ms slices.
const SLICE = Math.round(RATE * 0.01);
const energy = (x) => {
  const out = [];
  for (let i = 0; i + SLICE <= x.length; i += SLICE) {
    let sum = 0;
    for (let j = i; j < i + SLICE; j++) sum += x[j] * x[j];
    out.push(Math.sqrt(sum / SLICE));
  }
  return out;
};
const full = energy(samples), low = energy(bass);
const mean = (arr, from, to) => { let s = 0, n = 0; for (let i = Math.max(0, from); i < Math.min(arr.length, to); i++) { s += arr[i]; n++; } return n ? s / n : 0; };
const dB = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : "-inf").padStart(6);

console.log(`\n${path.basename(input)}: first ${(full.length / 100).toFixed(1)} s\n\n time   whole dB  bass dB`);
for (let s = 0; s < full.length; s += 50) console.log(`${(s / 100).toFixed(1).padStart(5)}s  ${dB(mean(full, s, s + 50))}   ${dB(mean(low, s, s + 50))}`);

// 4. The drop: where the bass level after a moment (2 s) most exceeds the level before it (2 s),
//    among moments that are loud afterwards. Then the exact 10 ms slice where it first gets loud.
const peakLevel = Math.max(...low.map((_, i) => mean(low, i, i + 200)));
let drop = 0, best = 0;
for (let i = 100; i < low.length - 200; i++) {
  const after = mean(low, i, i + 200), before = mean(low, i - 200, i);
  if (after < 0.5 * peakLevel) continue;
  const ratio = after / (before + 1e-6);
  if (ratio > best) { best = ratio; drop = i; }
}
const loudAfter = mean(low, drop, drop + 200);
let exact = drop;
for (let i = drop - 30; i < drop + 30; i++) if (i >= 0 && low[i] > 0.6 * loudAfter) { exact = i; break; }

// 5. Bar and beat from the bass after the drop. Onset strength = how much the bass rises from one slice to the next.
const onset = low.map((v, i) => Math.max(0, v - (low[i - 1] ?? v)));
const span = onset.slice(exact, exact + 2000);
const corr = (lag) => { let s = 0; for (let i = 0; i + lag < span.length; i++) s += span[i] * span[i + lag]; return s / (span.length - lag); };
const bestLag = (from, to) => { let lag = from, top = -1; for (let l = from; l <= to; l++) { const c = corr(l); if (c > top) { top = c; lag = l; } } return lag; };
// A bar of 4 beats at 60–180 bpm repeats every 1.33–4 s. Trust the bar: a short-lag guess can land on a dotted rhythm.
const bar = bestLag(133, 400) / 100;
const beat = bar / 4;
const quick = bestLag(25, 100) / 100;

// 6. The first bass hits after the drop (peaks of onset strength, at least 0.15 s apart).
const hits = [];
const strong = Math.max(...span) * 0.35;
for (let i = 0; i < span.length - 1 && hits.length < 16; i++) {
  if (span[i] > strong && span[i] >= (span[i - 1] ?? 0) && span[i] >= span[i + 1] && (!hits.length || i - hits.at(-1) > 15)) hits.push(i);
}

console.log(`
DROP   ${(exact / 100).toFixed(2)} s   (bass ${(best).toFixed(1)}× louder in the 2 s after than the 2 s before)
BAR    ${bar.toFixed(2)} s  → BEAT ${beat.toFixed(3)} s  (${(60 / beat).toFixed(1)} bpm)
       (short-lag guess: ${quick.toFixed(2)} s — if it isn't the beat or half of it, it is a dotted rhythm; trust the bar)
HITS   ${hits.map((h) => ((exact + h) / 100).toFixed(2)).join("  ")}

In src/plan.ts:  MUSIC = { file: "${input.replace(/^public\//, "")}", drop: ${(exact / 100).toFixed(2)}, beat: ${beat.toFixed(3)}, anchor: "<reveal scene id>", level: 0.1 }
Then \`npm run cuts\` shows where every cut falls in beats.`);
