/*
  Turn a GIF or a screen recording into a short silent clip for a post.

    npm run clip -- <input file> [--dir 2025_01] [--name my-clip] [--poster-at 1.5] [--width 1280]

  Writes two files to public/video/posts/<dir>/:
    <name>.mp4   H.264, no audio, at most --width pixels wide
    <name>.webp  the poster still, with a "PLAY CLIP" badge baked into the corner
  and prints the one line of HTML to paste into the post.

  Why it works this way:
  - A GIF of a few seconds of gameplay is tens of megabytes; the same clip as H.264 is a few
    hundred KB and is hardware-decoded on every phone (ISSUES.md §1a has the numbers).
  - Clips are tap-to-play (`controls preload="none"`): the reader downloads only the poster
    until they press play, and nothing moves unless they ask it to. The badge is baked into
    the poster because, with no client-side JavaScript, that is the only way to show a label
    that disappears once the clip is playing.
  - Clips live in public/ because astro:assets only handles images, and Sätteri passes a raw
    <video> tag through untouched.
  - This runs on the author's machine and needs ffmpeg on PATH. It is not part of the build.
*/
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import satori from "satori";
import sharp from "sharp";

const args = process.argv.slice(2);
const input = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (!input) {
  console.error("Usage: npm run clip -- <input file> [--dir 2025_01] [--name my-clip] [--poster-at 1.5] [--width 1280]");
  process.exit(1);
}

const now = new Date();
const dir = opt("dir", `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`);
const name = opt("name", basename(input, extname(input)));
const maxWidth = Number(opt("width", "1280"));
const posterAt = opt("poster-at", "0");

const outDir = join("public", "video", "posts", dir);
const mp4 = join(outDir, `${name}.mp4`);
const poster = join(outDir, `${name}.webp`);
mkdirSync(outDir, { recursive: true });

const run = (bin, a) => execFileSync(bin, a, { stdio: ["ignore", "pipe", "inherit"] }).toString();
const probe = (file) => {
  const [width, height] = run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0", file,
  ]).trim().split(",").map(Number);
  return { width, height };
};

// Scale down anything wider than the cap. A small pixel-art source is scaled *up* by a whole
// number with nearest-neighbour instead, so the browser isn't left to blur it across the
// article column. Either way both dimensions end up even, which H.264 requires.
const source = probe(input);
const factor = Math.floor(maxWidth / source.width);
const scale =
  source.width > maxWidth
    ? `scale=${maxWidth}:-2:flags=lanczos`
    : source.width < 640 && factor >= 2
      ? `scale=iw*${factor}:ih*${factor}:flags=neighbor,scale=trunc(iw/2)*2:trunc(ih/2)*2`
      : "scale=trunc(iw/2)*2:trunc(ih/2)*2";

run("ffmpeg", [
  "-v", "error", "-y", "-i", input,
  "-vf", `${scale},format=yuv420p`,
  "-c:v", "libx264", "-crf", "26", "-preset", "slow",
  "-movflags", "+faststart", "-an", mp4,
]);
const { width, height } = probe(mp4);

// Poster: one frame of the finished clip, plus the badge.
const frame = join(tmpdir(), `jgg-clip-${process.pid}.png`);
run("ffmpeg", ["-v", "error", "-y", "-ss", posterAt, "-i", mp4, "-frames:v", "1", frame]);

// The badge is the site's chip (CLAUDE.md §2.4): pink block, black border, hard shadow,
// Bebas Neue. satori converts the lettering to paths, so no font needs to be installed.
const k = Math.max(0.6, width / 1280);
const px = (n) => Math.round(n * k);
const font = readFileSync(
  fileURLToPath(import.meta.resolve("@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff")),
);
const labelSvg = await satori(
  { type: "div", props: { style: { display: "flex", fontFamily: "Bebas Neue", fontSize: px(44), lineHeight: 1, color: "#000" }, children: "PLAY CLIP" } },
  { width: px(260), height: px(60), fonts: [{ name: "Bebas Neue", data: font, weight: 400, style: "normal" }] },
);
const label = await sharp(Buffer.from(labelSvg)).trim().png().toBuffer({ resolveWithObject: true });

const pad = px(16), tri = px(30), gap = px(12), border = px(4), shadow = px(6), margin = px(24);
const blockW = pad + tri + gap + label.info.width + pad;
const blockH = pad + Math.max(tri, label.info.height) + pad;
const midY = blockH / 2;
const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${blockW + shadow}" height="${blockH + shadow}">
  <rect x="${shadow}" y="${shadow}" width="${blockW}" height="${blockH}" fill="#000"/>
  <rect x="${border / 2}" y="${border / 2}" width="${blockW - border}" height="${blockH - border}" fill="#ff98f3" stroke="#000" stroke-width="${border}"/>
  <polygon points="${pad},${midY - tri / 2} ${pad + tri},${midY} ${pad},${midY + tri / 2}" fill="#000"/>
</svg>`;

await sharp(frame)
  .composite([
    { input: Buffer.from(badgeSvg), left: margin, top: margin },
    { input: label.data, left: margin + pad + tri + gap, top: margin + Math.round((blockH - label.info.height) / 2) },
  ])
  .webp({ quality: 80 })
  .toFile(poster);
rmSync(frame, { force: true });

const kb = (file) => `${Math.round(statSync(file).size / 1024)} KB`;
const url = (file) => "/" + file.split(/[\\/]/).slice(1).join("/");
console.log(`\n${mp4}  ${kb(mp4)}  (${width}x${height})\n${poster}  ${kb(poster)}\n`);
console.log("Paste this on its own line in the post, and fill in the two descriptions:\n");
console.log(
  `<video controls loop muted playsinline preload="none" src="${url(mp4)}" poster="${url(poster)}" width="${width}" height="${height}" aria-label="DESCRIBE WHAT HAPPENS IN THE CLIP" title="CAPTION"></video>\n`,
);
