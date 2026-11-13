import script from "./script.json";
import timing from "./voice-timing.json";
import { buildTimeline, type Scene } from "./plan";

export { FPS } from "./plan";
export type { Scene, Line, Part } from "./plan";

// Every scene placed back to back, timed to the voice (rules live in plan.ts).
const built = buildTimeline(script, timing as Record<string, number>);

export const scenes: Scene[] = built.scenes;
export const cues = built.cues;
export const TOTAL_FRAMES = built.total;
export const MUSIC_START = built.musicStart;
export const scene = (id: string) => scenes.find((s) => s.id === id)!;
