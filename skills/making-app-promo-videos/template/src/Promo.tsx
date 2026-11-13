import { AbsoluteFill, Sequence } from "remotion";
import type { ComponentType } from "react";
import { Music } from "./Music";
import { Sounds } from "./Sounds";
import { scenes, type Scene } from "./timeline";
import { Hook } from "./scenes/Hook";
import { Showcase } from "./scenes/Showcase";
import { Features } from "./scenes/Features";
import { Ending } from "./scenes/Ending";

/** Scene id (plan.ts / script.json) → the component that draws it. Add new scenes here too. */
const components: Record<string, ComponentType<Scene>> = { hook: Hook, showcase: Showcase, features: Features, ending: Ending };

/** The whole video: each scene placed where plan.ts puts it, with its sounds. */
export const Promo = () => (
  <AbsoluteFill style={{ background: "#000000" }}>
    <Music />
    {scenes.map((s) => {
      const Draw = components[s.id];
      if (!Draw) throw new Error(`No component for scene "${s.id}" in Promo.tsx`);
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.duration}>
          <Draw {...s} />
          <Sounds id={s.id} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
