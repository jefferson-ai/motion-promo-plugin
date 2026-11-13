import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useId, type ReactNode } from "react";
import { clamp, settle } from "./motion";
import { colors } from "./brand";

/** How a scene comes in or goes out: `true` = sharpen in / push past the camera, "whip" = a fast sideways swipe with motion blur. */
type Move = boolean | "whip";

/**
 * The clean backdrop every scene plays on: light (the app's own backdrop) or black.
 * Its contents sharpen in at the start and push past the camera at the end,
 * or whip sideways with motion blur (the fast swipe between two thoughts).
 */
export const Stage = ({
  duration,
  dark = false,
  enter = true,
  exit = true,
  children,
}: {
  duration: number;
  dark?: boolean;
  enter?: Move;
  exit?: Move;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const inP = enter ? settle(frame, 0, enter === "whip" ? 9 : 10) : 1;
  const outP = exit ? interpolate(frame, [duration - 6, duration], [0, 1], { ...clamp, easing: (t) => t * t }) : 0;
  // A whip moves the whole scene sideways; the faster it moves, the more it smears.
  const slide = (enter === "whip" ? (1 - inP) * 900 : 0) - (exit === "whip" ? outP * 1100 : 0);
  const smear = (enter === "whip" ? Math.sin(Math.PI * Math.min(1, inP)) * 70 : 0) + (exit === "whip" ? outP * 90 : 0);
  const soft = (enter === true ? (1 - inP) * 10 : 0) + (exit === true ? outP * 12 : 0);
  const fade = (enter === true ? inP : 1) * (exit === true ? 1 - outP : 1);
  const scale = (enter === true ? 0.96 + 0.04 * inP : 1) + (exit === true ? 0.06 * outP : 0);
  return (
    <AbsoluteFill style={{ background: dark ? "#000000" : `linear-gradient(180deg, ${colors.backdropTop} 0%, ${colors.background} 42%)`, overflow: "hidden" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={id} x="-20%" y="0" width="140%" height="100%">
          <feGaussianBlur stdDeviation={`${smear} 0`} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          opacity: fade,
          transform: `translateX(${slide}px) scale(${scale})`,
          filter: smear > 0.5 ? `url(#${id})` : soft > 0.1 ? `blur(${soft}px)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
