import { interpolate, spring } from "remotion";
import { FPS } from "./plan";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * The video's one way of moving: glide to the target and stop, with no bounce.
 * Returns 0 before frame `at`, rising smoothly to 1 over about `frames` frames.
 */
export const settle = (frame: number, at: number, frames = 14) =>
  spring({ frame: frame - at, fps: FPS, config: { damping: 200 }, durationInFrames: frames });

/** Styles for something that "arrives": it sharpens, grows slightly and fades in (p goes 0 → 1). */
export const arrive = (p: number, rise = 24) => ({
  opacity: p,
  transform: `translateY(${(1 - p) * rise}px) scale(${0.96 + 0.04 * p})`,
  filter: `blur(${(1 - p) * 10}px)`,
});

/** A number that glides from one value to another starting at frame `at`. */
export const glide = (frame: number, at: number, from: number, to: number, frames = 10) =>
  interpolate(settle(frame, at, frames), [0, 1], [from, to]);
