import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { MUSIC } from "./plan";
import { MUSIC_START, TOTAL_FRAMES } from "./timeline";

/** One steady, quiet level the whole way through, with a fade-out only at the very end. No pumping around the voice. */
const level = (frame: number) =>
  (MUSIC?.level ?? 0) * interpolate(frame, [TOTAL_FRAMES - 36, TOTAL_FRAMES - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** The background song, placed so its drop lands on the first frame of MUSIC.anchor (see plan.ts). */
export const Music = () =>
  MUSIC ? (
    <Sequence from={Math.max(0, MUSIC_START)} layout="none">
      <Audio src={staticFile(MUSIC.file)} trimBefore={Math.max(0, -MUSIC_START)} volume={(f) => level(f + Math.max(0, MUSIC_START))} />
    </Sequence>
  ) : null;
