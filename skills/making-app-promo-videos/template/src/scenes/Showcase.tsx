import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Stage } from "../Stage";
import { Voice } from "../Voice";
import { Words } from "../Words";
import { Phone, Scrim, fill } from "../ui";
import { settle } from "../motion";
import type { Scene } from "../timeline";
import { brand, headline } from "../brand";

/**
 * The product reveal: a real capture on a 3D phone that rises and turns to face the camera,
 * with the line underneath. Swap the <Img> for <OffthreadVideo src=… muted /> to play a screen recording.
 */
export const Showcase = ({ duration, line }: Scene) => {
  const frame = useCurrentFrame();
  const rise = settle(frame, 0, 26);
  return (
    <Stage duration={duration} enter="whip" exit="whip">
      <Voice line={line} />
      <Phone width={760} x={540} y={interpolate(rise, [0, 1], [1500, 820])} focusY={0.35} rotateX={(1 - rise) * 18 + 6} rotateY={-14 + rise * 8}>
        <Img src={staticFile("app/screen.png")} style={fill} />
      </Phone>
      <Scrim />
      {line.parts.map((part, i) => (
        <div key={i} style={{ position: "absolute", top: 1440 + i * 120, width: "100%", padding: "0 90px", boxSizing: "border-box" }}>
          <Words text={part.text} start={part.from} frames={part.frames} emphasis={[brand.name.toLowerCase()]} style={headline(i === 0 ? 92 : 60)} />
        </div>
      ))}
    </Stage>
  );
};
