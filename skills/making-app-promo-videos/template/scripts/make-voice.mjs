// Speaks every line of src/script.json with Kokoro and saves it in public/voice/: `npm run voice`.
// "say" is what the voice reads (spelled the way it should sound); "show" is what appears on screen.
// It also writes src/voice-timing.json, which the video uses to time each scene to the speech.
import { KokoroTTS } from "kokoro-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Pick the voice by ear first (`npm run voices`). Override without editing: VOICE=bf_emma SPEED=1 npm run voice
const VOICE = process.env.VOICE ?? "af_bella";
const SPEED = Number(process.env.SPEED ?? 1.05); // a touch faster than default, for a casual feel
const MAX_PAUSE = 0.16;  // seconds: any silence longer than this is shortened to this

const script = JSON.parse(readFileSync(new URL("../src/script.json", import.meta.url)));
mkdirSync(new URL("../public/voice/", import.meta.url), { recursive: true });

/** Removes silence at both ends and shortens long pauses in the middle, so the speech flows. */
const tighten = (samples, rate) => {
  const size = Math.round(rate * 0.01); // look at the sound in 10 ms slices
  const quiet = [];
  for (let i = 0; i < samples.length; i += size) {
    let peak = 0;
    for (let j = i; j < Math.min(i + size, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]));
    quiet.push(peak < 0.015);
  }
  const first = quiet.indexOf(false), last = quiet.lastIndexOf(false);
  const keepEach = Math.round(MAX_PAUSE / 0.01 / 2);
  const kept = [];
  for (let w = Math.max(0, first - 1); w <= Math.min(quiet.length - 1, last + 2); w++) {
    if (quiet[w]) {
      let end = w;
      while (end < last && quiet[end + 1]) end++;
      const run = end - w + 1;
      if (run > keepEach * 2) {
        for (let k = 0; k < keepEach; k++) kept.push(w + k);
        for (let k = keepEach - 1; k >= 0; k--) kept.push(end - k);
        w = end;
        continue;
      }
    }
    kept.push(w);
  }
  const result = new Float32Array(kept.length * size);
  kept.forEach((w, i) => result.set(samples.subarray(w * size, Math.min((w + 1) * size, samples.length)), i * size));
  return result;
};

const saveWav = (url, samples, rate) => {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + samples.length * 2, 4); data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  writeFileSync(url, data);
};

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
const timing = {};
for (const line of script) {
  const spoken = await tts.generate(line.say, { voice: VOICE, speed: SPEED });
  const rate = spoken.sampling_rate;
  const tight = tighten(spoken.audio, rate);
  saveWav(new URL(`../public/voice/${line.id}.wav`, import.meta.url), tight, rate);
  timing[line.id] = Number((tight.length / rate).toFixed(3));
  console.log(`${line.id}: ${(spoken.audio.length / rate).toFixed(2)}s → ${timing[line.id]}s  "${line.say}"`);
}
writeFileSync(new URL("../src/voice-timing.json", import.meta.url), JSON.stringify(timing, null, 2) + "\n");
console.log(`Total speech: ${Object.values(timing).reduce((a, b) => a + b, 0).toFixed(1)}s`);
