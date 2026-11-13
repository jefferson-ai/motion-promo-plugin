import { continueRender, delayRender, staticFile } from "remotion";
import { FONT_FILE, FONT_NAME } from "./brand";

/** Loads the brand font (if one is set in brand.ts) before any frame is drawn. */
if (typeof document !== "undefined" && FONT_FILE) {
  const handle = delayRender(`Loading ${FONT_NAME}`);
  const face = new FontFace(FONT_NAME, `url(${staticFile(FONT_FILE)})`, { weight: "100 900" });
  face
    .load()
    .then(() => document.fonts.add(face))
    .catch((error) => console.error(`${FONT_NAME} failed to load`, error))
    .finally(() => continueRender(handle));
}
