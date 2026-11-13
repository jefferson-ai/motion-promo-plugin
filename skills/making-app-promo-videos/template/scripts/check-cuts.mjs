// Shows where every cut falls against the music's beat: `npm run cuts`
// Reads src/plan.ts (scenes + MUSIC) and the voice lengths. A cut "on the beat" is within ±0.1 beat of a whole
// or half beat after the drop. To move a cut, change the `tail` of the scene before it in plan.ts.
import fs from "node:fs";
import path from "node:path";
import { FPS, MUSIC, buildTimeline } from "../src/plan.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, "src", f), "utf8"));
const { scenes, total, musicStart } = buildTimeline(read("script.json"), read("voice-timing.json"));

console.log(`Video ${total} frames = ${(total / FPS).toFixed(2)} s\n`);
console.log("scene         starts at   length    beats after drop");
for (const s of scenes) {
  let beats = "";
  if (MUSIC) {
    const b = (s.from - (musicStart + MUSIC.drop * FPS)) / (MUSIC.beat * FPS);
    const off = Math.abs(b * 2 - Math.round(b * 2)) / 2;
    const near = Math.round(b * 2) / 2;
    const shift = Math.round((near - b) * MUSIC.beat * FPS);
    beats = `${b.toFixed(2).padStart(7)}  ${off <= 0.1 ? `✓ on ${near}` : `✗ ${off.toFixed(2)} beat off ${near} → ${shift > 0 ? "+" : ""}${shift} frames on the previous tail`}`;
  }
  console.log(`${s.id.padEnd(13)} ${String(s.from).padStart(5)} (${(s.from / FPS).toFixed(2)}s) ${String(s.duration).padStart(5)}f   ${beats}`);
}
if (!MUSIC) console.log("\nNo MUSIC set in src/plan.ts — nothing to line up with.");
else {
  const framesPerBeat = MUSIC.beat * FPS;
  console.log(`\nOne beat = ${framesPerBeat.toFixed(1)} frames. Adding N frames to a scene's tail moves every later cut by N.`);
}
