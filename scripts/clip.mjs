/*
  Turn a GIF or a screen recording into a short silent clip for a post.

    npm run clip -- <input file> [--dir 2025_01] [--name my-clip] [--poster-at 1.5] [--width 1280]

  Writes two files to public/video/posts/<dir>/:
    <name>.mp4   H.264, no audio, at most --width pixels wide
    <name>.webp  the poster still shown before the reader presses play
  and prints the one line of HTML to paste into the post.

  Why it works this way:
  - A GIF of a few seconds of gameplay is tens of megabytes; the same clip as H.264 is a few
    hundred KB and is hardware-decoded on every phone (ISSUES.md §1a has the numbers).
  - Clips are tap-to-play (`controls preload="none"`): the reader downloads only the poster
    until they press play, and nothing moves unless they ask it to.
  - Clips live in public/ because astro:assets only handles images, and Sätteri passes a raw
    <video> tag through untouched.
  - This runs on the author's machine and needs ffmpeg on PATH. It is not part of the build.
*/
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

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

// Poster: one frame of the finished clip. No play badge is drawn on it: the browser's own
// play button already marks it as a video, and a baked-in badge looks tappable but isn't.
run("ffmpeg", ["-v", "error", "-y", "-ss", posterAt, "-i", mp4, "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", poster]);

const kb = (file) => `${Math.round(statSync(file).size / 1024)} KB`;
const url = (file) => "/" + file.split(/[\\/]/).slice(1).join("/");
console.log(`\n${mp4}  ${kb(mp4)}  (${width}x${height})\n${poster}  ${kb(poster)}\n`);
console.log("Paste this on its own line in the post, and fill in the two descriptions:\n");
console.log(
  `<video controls loop muted playsinline preload="none" src="${url(mp4)}" poster="${url(poster)}" width="${width}" height="${height}" aria-label="DESCRIBE WHAT HAPPENS IN THE CLIP" title="CAPTION"></video>\n`,
);
