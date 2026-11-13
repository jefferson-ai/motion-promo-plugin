import { useCurrentFrame } from "remotion";
import { Stage } from "../Stage";
import { Voice } from "../Voice";
import { Words } from "../Words";
import { arrive, settle } from "../motion";
import type { Scene } from "../timeline";
import { colors, headline } from "../brand";

/** The problem, in the viewer's words: one short thought at a time, words hopping in with the voice. */
export const Hook = ({ duration, line }: Scene) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={duration} enter={false} exit="whip">
      <Voice line={line} />
      {line.parts.map((part, i) => {
        const next = line.parts[i + 1];
        const away = next ? settle(frame, next.from - 4, 8) : 0;
        if (frame < part.from - 2 || away > 0.995) return null;
        return (
          <div key={i} style={{ position: "absolute", top: 760, width: "100%", padding: "0 100px", boxSizing: "border-box", ...arrive(1 - away, -30) }}>
            <Words text={part.text} start={part.from} frames={part.frames} emphasis={i === line.parts.length - 1 ? ["gone"] : []} emphasisColor={colors.primary} style={headline(96)} />
          </div>
        );
      })}
    </Stage>
  );
};
