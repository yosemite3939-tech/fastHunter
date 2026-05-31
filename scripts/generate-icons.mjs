import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile } from "node:fs/promises";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/logo/fast-hunter-monogram.jpeg");
const output = resolve(root, "assets/icons");
await mkdir(output, { recursive: true });

const mask = Buffer.from(`
  <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" rx="224" fill="#fff"/>
  </svg>
`);
const icon = await sharp(source)
  .resize(1024, 1024, { fit: "cover" })
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

const sizes = [16, 32, 48, 64, 128, 256, 512];
const pngs = [];
for (const size of sizes) {
  const path = resolve(output, `icon-${size}.png`);
  await sharp(icon).resize(size, size).png().toFile(path);
  if (size <= 256) pngs.push(path);
}
await sharp(icon).resize(512, 512).png().toFile(resolve(output, "icon.png"));
await writeFile(resolve(output, "icon.ico"), await pngToIco(pngs));
console.log("Generated PNG and ICO app icons.");
