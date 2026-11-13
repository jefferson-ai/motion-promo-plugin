import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
import { colors } from "./brand";

/**
 * A headline whose words hop into place one at a time (a small, quick bounce), in step with the voice.
 * `start` and `frames` say when the line is spoken; `emphasis` lists the words to colour.
 */
export const Words = ({
  text,
  start,
  frames,
  emphasis = [],
  emphasisColor = colors.primary,
  style,
}: {
  text: string;
  start: number;
  frames: number;
  emphasis?: string[];
  emphasisColor?: string;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const total = words.reduce((sum, word) => sum + word.length, 0);
  let before = 0;
  return (
    <div style={style}>
      {words.map((word, i) => {
        // Each word arrives when the voice reaches it (estimated from how far into the line it is).
        const at = start + (frames * 0.82 * before) / total;
        before += word.length;
        const p = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 190, mass: 0.6 } });
        const seen = Math.min(1, p * 2);
        const strong = emphasis.includes(word.toLowerCase().replace(/[^a-z0-9]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: seen,
              transform: `translateY(${(1 - p) * 34}px) rotate(${(1 - p) * 5}deg)`,
              filter: seen < 0.98 ? `blur(${(1 - seen) * 8}px)` : undefined,
              color: strong ? emphasisColor : undefined,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};
