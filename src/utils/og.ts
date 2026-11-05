import satori from "satori";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/*
  Build-time Open Graph cards in the site's own visual language (CLAUDE.md §2): yellow
  field, black borders, hard offset shadows, Bebas Neue caps, the red wordmark.

  Why this shape:
  - The OG card is often the ONLY thing a person ever sees of this site (CLAUDE.md §1), so
    it gets the wordmark treatment rather than a cropped screenshot.
  - satori lays the card out with flexbox and emits SVG with every glyph converted to a
    <path>, so the result carries no font dependency; sharp — already installed as an Astro
    dependency for astro:assets — rasterises it to PNG. Twitter, Discord, Slack and Bluesky
    all refuse SVG for og:image, so the PNG step is not optional.
  - Everything runs at build time and writes a static file. No runtime cost, nothing to host.

  Bebas Neue is the only face used because it is the only one of the three that @fontsource
  ships as .woff — Piazzolla and Ysabeau are variable fonts published as .woff2 only, which
  satori cannot read. That constraint happens to agree with the design: this is display
  type, and Bebas is the face that carries the personality.
*/

const WIDTH = 1200;
const HEIGHT = 630;

const YELLOW = "#ffff00";
const PINK = "#ff98f3";
const RED = "#ff0000";
const BLACK = "#000000";
const WHITE = "#ffffff";

let fontData: Buffer | null = null;

async function bebas(): Promise<Buffer> {
  if (fontData) return fontData;
  const url = import.meta.resolve(
    "@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff",
  );
  fontData = await readFile(fileURLToPath(url));
  return fontData;
}

// Bebas is condensed, so it takes a lot of characters before a title needs to shrink.
// Three steps is enough to keep every current and plausible title inside three lines, and
// the type stays big enough to read in a phone-sized Discord embed.
function titleSize(title: string): number {
  if (title.length <= 28) return 128;
  if (title.length <= 55) return 100;
  return 78;
}

type Node = {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
};

const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
): Node => ({ type, props: { style, children } });

const chip = (text: string): Node =>
  el(
    "div",
    {
      display: "flex",
      border: `4px solid ${BLACK}`,
      backgroundColor: PINK,
      padding: "4px 16px 0px 16px",
      fontSize: 30,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: BLACK,
    },
    text,
  );

export interface OgCardOptions {
  /** Main line. Rendered in caps — Bebas has no lowercase. */
  title: string;
  /** Small pink chips above the title. Tags on a post, nothing on a site-level card. */
  chips?: string[];
}

export async function renderOgCard({
  title,
  chips = [],
}: OgCardOptions): Promise<Buffer> {
  const font = await bebas();

  // The wordmark's red-on-black offset (CLAUDE.md §2.4) is drawn as two stacked copies
  // rather than a textShadow, so it renders identically no matter how satori's shadow
  // support changes.
  const wordmark = el(
    "div",
    { display: "flex", position: "relative", height: 64 },
    [
      el(
        "div",
        {
          position: "absolute",
          top: 6,
          left: 6,
          fontSize: 56,
          color: BLACK,
          letterSpacing: "0.02em",
        },
        "Just Good Games",
      ),
      el(
        "div",
        {
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: 56,
          color: RED,
          letterSpacing: "0.02em",
        },
        "Just Good Games",
      ),
    ],
  );

  const card = el(
    "div",
    {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      backgroundColor: YELLOW,
      padding: 48,
      fontFamily: "Bebas Neue",
    },
    el(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        backgroundColor: WHITE,
        border: `8px solid ${BLACK}`,
        boxShadow: `16px 16px 0 ${BLACK}`,
        padding: 40,
      },
      [
        // Chips pin to the top; the title takes the rest of the panel and centres in it,
        // so a one-line title doesn't leave a hole above the wordmark.
        el(
          "div",
          {
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            gap: 24,
          },
          [
            chips.length > 0
              ? el(
                  "div",
                  { display: "flex", gap: 12 },
                  chips.map((text) => chip(text)),
                )
              : el("div", { display: "flex" }),
            el(
              "div",
              {
                display: "flex",
                flexGrow: 1,
                alignItems: "center",
                fontSize: titleSize(title),
                lineHeight: 1.02,
                color: BLACK,
                letterSpacing: "0.01em",
              },
              title,
            ),
          ],
        ),
        el(
          "div",
          {
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: `6px solid ${BLACK}`,
            paddingTop: 24,
          },
          [wordmark],
        ),
      ],
    ),
  );

  const svg = await satori(card as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: "Bebas Neue", data: font, weight: 400, style: "normal" }],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}
