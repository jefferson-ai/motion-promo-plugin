import { Audio, Sequence, staticFile } from "remotion";
import type { Line } from "./timeline";

/** Plays a line's voice recording (public/voice/<id>.wav) at the moment the timeline gives it. */
export const Voice = ({ line }: { line: Line }) => (
  <Sequence from={line.from} layout="none">
    <Audio src={staticFile(`voice/${line.id}.wav`)} />
  </Sequence>
);
