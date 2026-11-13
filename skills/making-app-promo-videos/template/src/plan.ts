// THE ONE PLACE that decides the video's structure: scene order, breathing room, sound cues and music.
// Both the video (timeline.ts → Promo.tsx) and the DaVinci Resolve export (scripts/export-resolve.mjs) read it,
// so they can never drift apart.
//
// Rules for this file (it is also loaded by plain Node, which only strips types):
//   - no imports
//   - only "erasable" TypeScript: type annotations are fine; enums, namespaces and parameter properties are not.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** One piece of on-screen text and when it is spoken (frames counted from the start of its scene). */
export type Part = { text: string; from: number; frames: number };
/** One spoken line: where its voice starts in the scene, how long it lasts, and its on-screen parts. */
export type Line = { id: string; from: number; frames: number; parts: Part[] };
/** A placed scene. `from` is its first frame in the whole video. */
export type Scene = { id: string; from: number; duration: number; line: Line };
/** A sound effect: [file in public/sfx without ".wav", frame inside the scene, volume 0–1]. */
export type Cue = [name: string, at: number, volume: number];

export type ScriptLine = { id: string; say: string; show: string[] };

/**
 * Each scene, in order. `id` must match an entry in script.json and a component in Promo.tsx.
 *   lead    frames before the voice starts
 *   tail    frames after the voice ends (tune these so later cuts land on the beat: `npm run cuts`)
 *   min     shortest the scene may be
 *   sounds  the scene's sound effects, worked out from its placed timing
 */
export const SCENES: {
  id: string;
  lead: number;
  tail: number;
  min?: number;
  sounds: (scene: Scene) => Cue[];
}[] = [
  { id: "hook", lead: 6, tail: 10, sounds: ({ line: { parts } }) => parts.map((p): Cue => ["pop", p.from, 0.35]) },
  {
    id: "showcase",
    lead: 10,
    tail: 24,
    sounds: ({ duration, line: { parts } }) => [["whoosh", 0, 0.3], ["pop", parts[0].from + 4, 0.4], ["whoosh", duration - 8, 0.3]],
  },
  {
    id: "features",
    lead: 10,
    tail: 18,
    sounds: ({ duration, line: { parts } }) => [
      ...parts.map((p): Cue => ["pop", p.from, 0.4]),
      ...parts.slice(1).map((p): Cue => ["whoosh", p.from - 5, 0.25]),
      ["whoosh", duration - 8, 0.3],
    ],
  },
  {
    id: "ending",
    lead: 14,
    tail: 70,
    sounds: ({ line: { parts } }) => {
      const name = parts[1] ?? parts[0];
      return [["chord", name.from + name.frames - 6, 0.6]];
    },
  },
];

/**
 * Background music, or null for none.
 *   file    in public/ (e.g. "music/song.m4a")
 *   drop    seconds into the song where the beat drops (`npm run measure -- public/music/song.m4a`)
 *   beat    seconds per beat, from the same measurement
 *   anchor  the scene whose first frame the drop should land on (usually the product reveal)
 *   level   ONE steady, quiet level for the whole video (0.08–0.12 sits under a voice)
 */
export type Music = { file: string; drop: number; beat: number; anchor: string; level: number };
export const MUSIC = null as Music | null; // e.g. { file: "music/song.m4a", drop: 8.03, beat: 0.735, anchor: "showcase", level: 0.1 }

/** Every effect is played at this share of its cue volume, so the voice stays on top. */
export const SFX_GAIN = 0.7;

const weight = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, "").length || 1;

/** Builds a line's timing from the length of its voice recording; on-screen parts get time by their share of letters. */
const buildLine = (entry: ScriptLine, seconds: number, from: number): Line => {
  const frames = Math.ceil(seconds * FPS);
  const total = entry.show.reduce((sum, text) => sum + weight(text), 0);
  let used = 0;
  const parts = entry.show.map((text) => {
    const part = { text, from: from + Math.round((frames * used) / total), frames: Math.round((frames * weight(text)) / total) };
    used += weight(text);
    return part;
  });
  return { id: entry.id, from, frames, parts };
};

/** Places every scene back to back (no gaps), timed to the voice. Pure: same input, same output. */
export const buildTimeline = (script: ScriptLine[], timing: Record<string, number>) => {
  let cursor = 0;
  const scenes = SCENES.map((plan) => {
    const entry = script.find((l) => l.id === plan.id);
    if (!entry) throw new Error(`script.json has no line with id "${plan.id}"`);
    const line = buildLine(entry, timing[plan.id] ?? 2, plan.lead);
    const duration = Math.max(plan.min ?? 0, plan.lead + line.frames + plan.tail);
    const scene: Scene = { id: plan.id, from: cursor, duration, line };
    cursor += duration;
    return scene;
  });
  const cues = Object.fromEntries(scenes.map((s, i) => [s.id, SCENES[i].sounds(s)])) as Record<string, Cue[]>;
  const music = MUSIC;
  const anchor = music ? scenes.find((s) => s.id === music.anchor) : undefined;
  if (music && !anchor) throw new Error(`MUSIC.anchor "${music.anchor}" is not a scene id`);
  const musicStart = music && anchor ? anchor.from - Math.round(music.drop * FPS) : 0;
  return { scenes, cues, total: cursor, musicStart };
};
