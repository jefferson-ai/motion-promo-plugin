import "./fonts";
import { Composition } from "remotion";
import { Promo } from "./Promo";
import { FPS, HEIGHT, WIDTH } from "./plan";
import { TOTAL_FRAMES } from "./timeline";

// One "Composition" = one video. Its length follows the voice-over.
export const Root = () => (
  <Composition id="Promo" component={Promo} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={TOTAL_FRAMES} />
);
