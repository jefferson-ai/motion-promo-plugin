import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties } from "react";
/** Splits text into visible characters, so an emoji or accent counts as one. */
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
export const letters = (text: string) => Array.from(segmenter.segment(text), (s) => s.segment);

/**
 * A short punch line whose letters bounce up one after another (used sparingly, for the big moments).
 * `colorFrom` colours the letters from that position on (e.g. the app's name).
 */
export const Letters = ({
  text, start, stagger = 1.4, colorFrom, color, style,
}: { text: string; start: number; stagger?: number; colorFrom?: number; color?: string; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={style}>
      {letters(text).map((letter, i) => {
        const p = spring({ frame: frame - start - i * stagger, fps, config: { damping: 10, stiffness: 170, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block", whiteSpace: "pre",
              opacity: Math.min(1, p * 2.5), transform: `translateY(${(1 - p) * 70}px)`,
              color: colorFrom !== undefined && i >= colorFrom ? color : undefined,
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};
