// The product's own look. Take these from the real app (its colour file / design tokens), not from taste.
// Scene timings live in plan.ts.
export const brand = {
  name: "Acme", // shown on screen
  spokenName: "Acme", // how the voice should say it — spell it out in script.json "say" lines
};

export const colors = {
  background: "#F4F6FB", // light stage colour
  backdropTop: "#DCE7FA", // top of the light stage's soft gradient
  text: "#172844",
  textMuted: "#596D8C",
  primary: "#3D66C5", // brand colour: one emphasised word, the product name
};

/**
 * One font, the app's own. To load a file, put it in public/fonts/ and set FONT_FILE (e.g. "fonts/Brand.ttf");
 * include its licence. With null, the system font is used.
 */
export const FONT_FILE: string | null = null;
export const FONT_NAME = "Brand";
export const font = `${FONT_NAME}, Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif`;

/** Big headline text: heavy, tight letters, tight lines. */
export const headline = (size: number, color: string = colors.text) =>
  ({ fontFamily: font, fontWeight: 700, fontSize: size, letterSpacing: "-0.035em", lineHeight: 1.06, color, textAlign: "center" }) as const;
