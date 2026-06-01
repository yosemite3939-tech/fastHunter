import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const extension = resolve(root, "apps/browser-extension/dist");
const outputDir = resolve(root, "release");
await mkdir(outputDir, { recursive: true });
const outputPath = resolve(outputDir, "fasthunter-browser-extension.zip");
const publicDir = resolve(root, "apps/web/public/downloads");
await mkdir(publicDir, { recursive: true });
const output = createWriteStream(outputPath);
const zip = archiver("zip", { zlib: { level: 9 } });
zip.pipe(output);
zip.directory(extension, false);
await new Promise((resolvePromise, rejectPromise) => {
  output.on("close", resolvePromise);
  output.on("error", rejectPromise);
  zip.on("error", rejectPromise);
  zip.finalize();
});
await copyFile(outputPath, resolve(publicDir, "fasthunter-browser-extension.zip"));
console.log("Created release/fasthunter-browser-extension.zip and copied it to the website downloads.");
