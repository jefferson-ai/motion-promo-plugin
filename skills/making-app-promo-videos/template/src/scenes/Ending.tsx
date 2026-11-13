import { Img, staticFile, useCurrentFrame } from "remotion";
import { Letters } from "../Letters";
import { Stage } from "../Stage";
import { Voice } from "../Voice";
import { Words } from "../Words";
import { arrive, settle } from "../motion";
import type { Scene } from "../timeline";
import { colors, headline } from "../brand";

/** Tagline → icon + the name in letters that bounce up → the call to action ("Coming soon." before launch). */
export const Ending = ({ duration, line }: Scene) => {
  const frame = useCurrentFrame();
  const [tagline, name, cta] = line.parts;
  return (
    <Stage duration={duration} enter="whip" exit={false}>
      <Voice line={line} />
      <Img src={staticFile("app/icon.png")} style={{ position: "absolute", left: 450, top: 560, width: 180, height: 180, borderRadius: 40, ...arrive(settle(frame, 0, 14), 0) }} />
      {tagline ? <Words text={tagline.text} start={tagline.from} frames={tagline.frames} style={{ ...headline(64, colors.textMuted), fontWeight: 600, position: "absolute", top: 800, width: "100%" }} /> : null}
      {name ? <Letters text={name.text} start={name.from} colorFrom={0} color={colors.primary} style={{ ...headline(170), fontWeight: 800, position: "absolute", top: 870, width: "100%" }} /> : null}
      {cta ? <Words text={cta.text} start={cta.from} frames={cta.frames} style={{ ...headline(68), position: "absolute", top: 1070, width: "100%" }} /> : null}
    </Stage>
  );
};
