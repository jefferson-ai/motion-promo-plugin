import { Audio, Sequence, staticFile } from "remotion";
import { SFX_GAIN } from "./plan";

/** Plays one sound effect from public/sfx/ starting at frame `at` (counted from the start of its scene). */
export const Sfx = ({ name, at = 0, volume = 0.6 }: { name: string; at?: number; volume?: number }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume * SFX_GAIN} />
  </Sequence>
);
