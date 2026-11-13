// Makes the same test line in several Kokoro voices, so you can pick one by ear: `npm run voices`.
// Kokoro runs on this Mac: nothing is sent anywhere, and its licence (Apache 2.0) allows use in a promo.
import { KokoroTTS } from "kokoro-js";
import { mkdirSync } from "node:fs";

// Pass your own test line: `npm run voices -- "Meet Acme. Coming soon."`
const line = process.argv[2] ?? "Okay, so. It's month end, and your money is gone? Meet Acme.";
// Kokoro's English voices ("af"/"bf" = American/British woman, "am"/"bm" = man). Trim this to what the person wants to hear.
const voices = {
  af_heart: "American woman, warm",
  af_bella: "American woman, lively",
  af_nicole: "American woman, soft and close",
  af_aoede: "American woman",
  af_kore: "American woman",
  af_sarah: "American woman",
  af_nova: "American woman",
  af_sky: "American woman",
  af_alloy: "American woman",
  af_jessica: "American woman",
  af_river: "American woman",
  bf_emma: "British woman",
  bf_isabella: "British woman",
  bf_alice: "British woman",
  bf_lily: "British woman",
  am_michael: "American man",
  am_puck: "American man, upbeat",
  bm_george: "British man",
};

mkdirSync("voice-samples", { recursive: true });
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
for (const [voice, description] of Object.entries(voices)) {
  try {
    const audio = await tts.generate(line, { voice });
    await audio.save(`voice-samples/${voice}.wav`);
    console.log(`${voice}.wav  (${description})`);
  } catch (error) {
    console.log(`${voice}: not available (${error.message})`);
  }
}
