// Generates the PWA / favicon asset set from the PointsPath brand mark.
// Run with: npm run icons
//
// The mark is a filled paper plane on the app's near-black→charcoal gradient, drawn
// as pure vector geometry so it rasterizes without depending on any font.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const GRADIENT_FROM = "#1C1917";
const GRADIENT_TO = "#44403C";

// Paper plane drawn in a 100x100 box as two triangles meeting at the crease:
// the near wing reads solid white, the far wing sits back at lower opacity so
// the fold has depth. Bounding box is x:4–96, y:6–94, centred on (50,50).
const NEAR_WING = "M4 50 L96 6 L40 58 Z";
const FAR_WING = "M40 58 L96 6 L58 94 Z";
const PLANE_SPAN = 92;
const PLANE_CX = 50;
const PLANE_CY = 50;

/**
 * @param size      canvas edge length in px
 * @param coverage  fraction of the canvas the plane should span (maskable icons
 *                  need a smaller value so the mark survives the OS circle mask)
 * @param radius    corner radius as a fraction of size (0 = full bleed)
 */
function markSvg({ size, coverage = 0.62, radius = 0.22 }) {
  const scale = (size * coverage) / PLANE_SPAN;
  const c = size / 2;
  const rx = size * radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GRADIENT_FROM}"/>
      <stop offset="1" stop-color="${GRADIENT_TO}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
  <g transform="translate(${c} ${c}) scale(${scale}) translate(${-PLANE_CX} ${-PLANE_CY})">
    <path d="${NEAR_WING}" fill="#ffffff"/>
    <path d="${FAR_WING}" fill="#ffffff" fill-opacity="0.72"/>
  </g>
</svg>`;
}

const targets = [
  { file: "pwa-192x192.png", size: 192 },
  { file: "pwa-512x512.png", size: 512 },
  // Maskable: full bleed, mark pulled into the safe zone.
  { file: "pwa-maskable-512x512.png", size: 512, coverage: 0.46, radius: 0 },
  // iOS applies its own rounded mask, so ship a square.
  { file: "apple-touch-icon.png", size: 180, radius: 0 },
];

await mkdir(OUT, { recursive: true });

for (const { file, ...opts } of targets) {
  const svg = markSvg(opts);
  await sharp(Buffer.from(svg)).png().toFile(join(OUT, file));
  console.log(`✓ ${file} (${opts.size}x${opts.size})`);
}

await writeFile(join(OUT, "favicon.svg"), markSvg({ size: 64 }), "utf8");
console.log("✓ favicon.svg");
