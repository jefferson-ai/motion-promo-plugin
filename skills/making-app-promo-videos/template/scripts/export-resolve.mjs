// Builds an editable timeline for DaVinci Resolve (out/resolve/promo.fcpxml):
// one video clip per scene (the cuts), and every voice line, sound effect and the music as its own audio clip.
// Run with `npm run resolve`. It renders the scene clips, copies the sound files and writes the timeline.
// Scenes, cues and music come from src/plan.ts — the same list the video plays — so nothing is repeated by hand.
// `--no-render` rewrites the timeline without re-rendering the clips.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { FPS, WIDTH, HEIGHT, MUSIC, SFX_GAIN, buildTimeline } from "../src/plan.ts";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "out", "resolve");
const media = path.join(out, "media");
const script = JSON.parse(fs.readFileSync(path.join(root, "src/script.json"), "utf8"));
const timing = JSON.parse(fs.readFileSync(path.join(root, "src/voice-timing.json"), "utf8"));
const { scenes, cues, total: TOTAL, musicStart } = buildTimeline(script, timing);
const TITLE = path.basename(root);

// ---- Helpers ----
const wavInfo = (file) => {
  const b = fs.readFileSync(file);
  const fmt = b.indexOf("fmt ") + 8, data = b.indexOf("data");
  const channels = b.readUInt16LE(fmt + 2), rate = b.readUInt32LE(fmt + 4), blockAlign = b.readUInt16LE(fmt + 12);
  return { channels, rate, seconds: b.readUInt32LE(data + 4) / blockAlign / rate };
};
const t = (frames) => `${Math.round(frames)}/${FPS}s`;
const dB = (gain) => `${(20 * Math.log10(gain)).toFixed(1)}dB`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

fs.mkdirSync(path.join(media, "scenes"), { recursive: true });
for (const dir of ["voice", "sfx", "music"]) fs.mkdirSync(path.join(media, dir), { recursive: true });

// ---- 1. Render each scene as its own silent clip ----
if (!process.argv.includes("--no-render")) {
  scenes.forEach((scene, i) => {
    const file = path.join(media, "scenes", `${String(i + 1).padStart(2, "0")}-${scene.id}.mp4`);
    console.log(`Rendering ${path.basename(file)} (frames ${scene.from}-${scene.from + scene.duration - 1})`);
    execFileSync("npx", ["remotion", "render", "Promo", file, `--frames=${scene.from}-${scene.from + scene.duration - 1}`, "--muted", "--crf=14", "--log=error"], { cwd: root, stdio: "inherit" });
  });
}

// ---- 2. Collect the clips ----
const assets = []; // { id, name, src, seconds, channels, rate, video }
const asset = (rel, info) => {
  const src = path.join(media, rel);
  let a = assets.find((x) => x.src === src);
  if (!a) { a = { id: `a${assets.length + 1}`, name: path.basename(rel), src, ...info }; assets.push(a); }
  return a;
};
const copy = (from, rel) => { fs.copyFileSync(path.join(root, "public", from), path.join(media, rel)); return path.join(media, rel); };

const lanes = []; // end frame of the last clip on each sound-effect lane, so overlapping effects get separate tracks
const sfxLane = (start, end) => {
  let i = lanes.findIndex((busyUntil) => busyUntil <= start);
  if (i < 0) i = lanes.length;
  lanes[i] = end;
  return -(2 + i);
};

const spine = scenes.map((scene, i) => {
  const rel = `scenes/${String(i + 1).padStart(2, "0")}-${scene.id}.mp4`;
  const video = asset(rel, { seconds: scene.duration / FPS, video: true });
  const children = [];
  // The voice line
  const voiceInfo = wavInfo(copy(`voice/${scene.id}.wav`, `voice/${scene.id}.wav`));
  const voice = asset(`voice/${scene.id}.wav`, voiceInfo);
  children.push({ a: voice, lane: -1, offset: scene.line.from, frames: Math.ceil(voiceInfo.seconds * FPS), gain: 1, role: "dialogue", name: `Voice: ${scene.id}` });
  // The sound effects
  for (const [name, at, volume] of cues[scene.id] ?? []) {
    const info = wavInfo(copy(`sfx/${name}.wav`, `sfx/${name}.wav`));
    const frames = Math.ceil(info.seconds * FPS);
    children.push({ a: asset(`sfx/${name}.wav`, info), lane: sfxLane(scene.from + at, scene.from + at + frames), offset: at, frames, gain: volume * SFX_GAIN, role: "effects", name: `SFX: ${name}` });
  }
  return { scene, video, children };
});

// The music: one long clip under everything, attached to the first scene
if (MUSIC) {
copy(MUSIC.file, MUSIC.file);
const probe = execFileSync("npx", ["remotion", "ffprobe", "-v", "error", "-show_entries", "stream=channels,sample_rate:format=duration", "-of", "csv=p=0", path.join(media, MUSIC.file)], { cwd: root }).toString().trim().split(/\s+/);
const [rate, channels] = probe[0].split(",").map(Number);
const music = asset(MUSIC.file, { seconds: Number(probe[probe.length - 1]), channels, rate });
const musicLane = -(2 + lanes.length);
// If the song has to start before the video does, skip its opening instead of placing it before frame 0.
const trim = Math.max(0, -musicStart), at = Math.max(0, musicStart);
spine[0].children.push({ a: music, lane: musicLane, offset: at, start: trim, frames: TOTAL - at, gain: MUSIC.level, role: "music", name: `Music: ${path.basename(MUSIC.file)}` });
}

// ---- 3. Write the timeline (FCPXML 1.9, which Resolve imports) ----
const xml = [];
xml.push(`<?xml version="1.0" encoding="UTF-8"?>`, `<!DOCTYPE fcpxml>`, `<fcpxml version="1.9">`, `  <resources>`);
xml.push(`    <format id="r0" name="FFVideoFormat${WIDTH}x${HEIGHT}p${FPS}" frameDuration="1/${FPS}s" width="${WIDTH}" height="${HEIGHT}"/>`);
for (const a of assets) {
  const kind = a.video ? `hasVideo="1" videoSources="1" format="r0"` : `hasAudio="1" audioSources="1" audioChannels="${a.channels}" audioRate="${a.rate}"`;
  xml.push(`    <asset id="${a.id}" name="${esc(a.name)}" start="0s" duration="${t(Math.ceil(a.seconds * FPS))}" ${kind}>`);
  xml.push(`      <media-rep kind="original-media" src="${pathToFileURL(a.src).href}"/>`, `    </asset>`);
}
xml.push(`  </resources>`, `  <library>`, `    <event name="${esc(TITLE)}">`, `      <project name="${esc(TITLE)} (editable)">`);
xml.push(`        <sequence format="r0" duration="${t(TOTAL)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">`, `          <spine>`);
for (const { scene, video, children } of spine) {
  xml.push(`            <asset-clip ref="${video.id}" name="${esc(video.name)}" offset="${t(scene.from)}" start="0s" duration="${t(scene.duration)}" format="r0" tcFormat="NDF">`);
  for (const c of children) {
    xml.push(`              <asset-clip ref="${c.a.id}" name="${esc(c.name)}" lane="${c.lane}" offset="${t(c.offset)}" start="${t(c.start ?? 0)}" duration="${t(c.frames)}" audioRole="${c.role}">`);
    xml.push(`                <adjust-volume amount="${dB(c.gain)}"/>`, `              </asset-clip>`);
  }
  xml.push(`            </asset-clip>`);
}
xml.push(`          </spine>`, `        </sequence>`, `      </project>`, `    </event>`, `  </library>`, `</fcpxml>`, ``);
fs.writeFileSync(path.join(out, "promo.fcpxml"), xml.join("\n"));

// A plain-text cue sheet as well, in case the levels or positions need re-entering by hand
const sheet = ["time (s)\tframe\ttrack\tclip\tlevel"];
for (const { scene, children } of spine) {
  sheet.push(`${(scene.from / FPS).toFixed(2)}\t${scene.from}\tVideo\t${scene.id} (${scene.duration} frames)\t`);
  for (const c of children) sheet.push(`${((scene.from + c.offset) / FPS).toFixed(2)}\t${scene.from + c.offset}\tAudio ${-c.lane}\t${c.name}\t${dB(c.gain)}`);
}
fs.writeFileSync(path.join(out, "cue-sheet.tsv"), sheet.join("\n") + "\n");
console.log(`Wrote ${path.join(out, "promo.fcpxml")} — ${scenes.length} scene clips, ${spine.reduce((n, s) => n + s.children.length, 0)} audio clips, ${TOTAL} frames`);
