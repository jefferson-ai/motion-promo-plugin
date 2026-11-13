import type { CSSProperties, ReactNode } from "react";
import { colors } from "./brand";

/** The shape of your screen captures (height ÷ width). iPhone 17 Pro simulator = 2622 / 1206. */
export const SCREEN_RATIO = 2622 / 1206;

/**
 * A phone showing a real capture of the app (a screenshot or a screen recording).
 * The point (`focusX`, `focusY`) of the screen, as fractions, is placed at (`x`, `y`) in the video,
 * so the "camera" can frame any part of the app; `rotateX`/`rotateY` tilt it in 3D.
 */
export const Phone = ({
  width, x, y, focusX = 0.5, focusY = 0.5, rotateX = 0, rotateY = 0, style, children,
}: {
  width: number; x: number; y: number; focusX?: number; focusY?: number; rotateX?: number; rotateY?: number;
  style?: CSSProperties; children: ReactNode;
}) => {
  const height = width * SCREEN_RATIO;
  return (
    <div
      style={{
        position: "absolute", left: x - focusX * width, top: y - focusY * height, width, height, boxSizing: "border-box",
        padding: width * 0.017, borderRadius: width * 0.145, background: "#0A0A0C",
        boxShadow: "0 70px 140px rgba(23, 40, 68, 0.30)",
        transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
        transform: `perspective(2600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        ...style,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: width * 0.13, overflow: "hidden", position: "relative" }}>{children}</div>
    </div>
  );
};

/** Fills the phone's screen with an image or video. */
export const fill: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

/** A soft fade to the stage colour at the bottom of the frame, so a headline can sit over the phone. */
export const Scrim = ({ from = 1250, solid = 1520 }: { from?: number; solid?: number }) => (
  <div
    style={{
      position: "absolute", left: 0, right: 0, top: from, bottom: 0,
      background: `linear-gradient(180deg, ${colors.background}00 0px, ${colors.background} ${solid - from}px)`,
    }}
  />
);
