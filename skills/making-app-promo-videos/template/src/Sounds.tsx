import { Sfx } from "./Sfx";
import { cues } from "./timeline";

/** Plays a scene's sound effects exactly as plan.ts lists them (the Resolve export reads the same list). */
export const Sounds = ({ id }: { id: string }) => (
  <>
    {(cues[id] ?? []).map(([name, at, volume], i) => (
      <Sfx key={i} name={name} at={at} volume={volume} />
    ))}
  </>
);
