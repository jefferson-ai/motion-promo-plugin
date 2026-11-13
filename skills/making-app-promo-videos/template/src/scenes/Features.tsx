import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../Stage";
import { Voice } from "../Voice";
import { Words } from "../Words";
import { arrive, settle } from "../motion";
import type { Scene } from "../timeline";
import { headline } from "../brand";

// One real piece of the app per feature, cropped from your captures into public/app/ (sizes in pixels).
// Each floats alone on the clean stage, one card at a time, matching the line's parts (script.json "show").
const WIDTH = 900;
const features = [
  { emphasis: ["budgets"], tilt: -12, pieces: [{ file: "piece-1", w: 1100, h: 460, radius: 56 }] },
  { emphasis: ["goals"], tilt: 12, pieces: [{ file: "piece-2", w: 1050, h: 190, radius: 50 }, { file: "piece-3", w: 1050, h: 190, radius: 50 }] },
  { emphasis: ["where"], tilt: -10, pieces: [{ file: "piece-4", w: 1050, h: 520, radius: 56 }] },
];
const CARD_Y = 800; // centre of the floating piece
const TEXT_Y = 1240;

/** One real UI card per thought: drops in tilted, floats, then flies up and blurs when the next thought starts. */
export const Features = ({ duration, line }: Scene) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage duration={duration} enter="whip" exit="whip">
      <Voice line={line} />

      {features.slice(0, line.parts.length).map((feature, i) => {
        const part = line.parts[i];
        const next = line.parts[i + 1];
        // It drops in with a small bounce when its words start, and flies up and away when the next thought starts.
        const drop = spring({ frame: frame - (part.from - 3), fps, config: { damping: 12, stiffness: 150, mass: 0.7 } });
        const away = next ? settle(frame, next.from - 6, 10) : 0;
        if (frame < part.from - 3 || away > 0.995) return null;
        const drift = Math.sin(frame / 20 + i);
        const total = feature.pieces.reduce((sum, piece) => sum + (WIDTH * piece.h) / piece.w, 0) + (feature.pieces.length - 1) * 34;
        let top = CARD_Y - total / 2;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute", left: 0, top: 0, width: 1080, height: 1920,
                opacity: Math.min(1, drop * 3) * (1 - away),
                filter: away > 0.01 ? `blur(${away * 16}px)` : undefined,
                transformOrigin: `540px ${CARD_Y}px`,
                transform: `perspective(1800px) translateY(${(drop - 1) * 480 - away * 700}px) rotateX(${(8 + drift) * (1 - away)}deg) rotateY(${(feature.tilt + drift * 2) * (1 - away)}deg) scale(${1 - away * 0.3})`,
              }}
            >
              {feature.pieces.map((piece, k) => {
                const height = (WIDTH * piece.h) / piece.w;
                const y = top;
                top += height + 34;
                // In a pair, the second card follows the first a moment later.
                const follow = k === 0 ? 1 : settle(frame, part.from + 5, 12);
                return (
                  <Img
                    key={k}
                    src={staticFile(`app/${piece.file}.png`)}
                    style={{
                      position: "absolute", left: 540 - WIDTH / 2, top: y, width: WIDTH, height,
                      borderRadius: (piece.radius * WIDTH) / piece.w, boxShadow: "0 50px 110px rgba(23, 40, 68, 0.24)",
                      ...arrive(follow, 60),
                    }}
                  />
                );
              })}
            </div>
            <div style={{ position: "absolute", top: TEXT_Y, width: "100%", padding: "0 110px", boxSizing: "border-box", ...arrive(1 - away, -20) }}>
              <Words text={part.text} start={part.from} frames={part.frames} emphasis={feature.emphasis} style={headline(88)} />
            </div>
          </div>
        );
      })}
    </Stage>
  );
};
