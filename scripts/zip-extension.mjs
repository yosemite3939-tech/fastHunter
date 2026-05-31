import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const extension = resolve(root, "apps/browser-extension/dist");
const outputDir = resolve(root, "release");
await mkdir(outputDir, { recursive: true });
const output = createWriteStream(resolve(outputDir, "fasthunter-browser-extension.zip"));
const zip = archiver("zip", { zlib: { level: 9 } });
zip.pipe(output);
zip.directory(extension, false);
await zip.finalize();
console.log("Created release/fasthunter-browser-extension.zip");
