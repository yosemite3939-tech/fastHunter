import { existsSync } from "node:fs";
import { extname, join, parse } from "node:path";
import type { ChunkRecord, DownloadCategory } from "@fasthunter/shared-types";

const EXTENSION_CATEGORIES: Record<DownloadCategory, string[]> = {
  videos: [".mp4", ".mkv", ".mov", ".avi", ".webm", ".m4v"],
  music: [".mp3", ".aac", ".wav", ".flac", ".m4a", ".ogg"],
  documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"],
  images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".heic"],
  archives: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"],
  apps: [".exe", ".msi", ".msix", ".dmg", ".pkg", ".deb", ".apk"],
  others: [],
};

const MIME_PREFIXES: Array<[string, DownloadCategory]> = [
  ["video/", "videos"],
  ["audio/", "music"],
  ["image/", "images"],
  ["application/pdf", "documents"],
  ["application/zip", "archives"],
  ["application/x-rar", "archives"],
  ["application/x-7z", "archives"],
  ["application/vnd.microsoft", "documents"],
  ["application/msword", "documents"],
];

export function sanitizeFileName(value: string): string {
  const clean = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
  return clean.replace(/[. ]+$/, "") || "download";
}

export function detectFileName(url: string, contentDisposition?: string | null): string {
  if (contentDisposition) {
    const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plain = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
    const selected = encoded ? decodeURIComponent(encoded) : plain;
    if (selected) return sanitizeFileName(selected);
  }

  const pathname = new URL(url).pathname;
  const candidate = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "download");
  return sanitizeFileName(candidate);
}

export function supportsByteRanges(headers: Headers, status = 200): boolean {
  const acceptRanges = headers.get("accept-ranges")?.toLowerCase();
  return status === 206 || acceptRanges === "bytes";
}

export function readTotalBytes(headers: Headers): number {
  const range = headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
  const length = range ?? headers.get("content-length");
  return length ? Number.parseInt(length, 10) || 0 : 0;
}

export function categorizeFile(fileName: string, mimeType = ""): DownloadCategory {
  const mime = mimeType.toLowerCase();
  const byMime = MIME_PREFIXES.find(([prefix]) => mime.startsWith(prefix));
  if (byMime) return byMime[1];
  const extension = extname(fileName).toLowerCase();
  return (Object.entries(EXTENSION_CATEGORIES) as Array<[DownloadCategory, string[]]>)
    .find(([, extensions]) => extensions.includes(extension))?.[0] ?? "others";
}

export function calculateChunks(
  downloadId: string,
  totalBytes: number,
  requestedConnections: number,
  tempDir: string,
): ChunkRecord[] {
  if (totalBytes <= 0) return [];
  const minimumChunkSize = 1024 * 1024;
  const connectionCount = Math.max(1, Math.min(requestedConnections, Math.ceil(totalBytes / minimumChunkSize)));
  const chunkSize = Math.ceil(totalBytes / connectionCount);
  return Array.from({ length: connectionCount }, (_, index) => {
    const start = index * chunkSize;
    const end = Math.min(totalBytes - 1, start + chunkSize - 1);
    return {
      id: `${downloadId}-${index}`,
      downloadId,
      index,
      start,
      end,
      downloaded: 0,
      status: "queued",
      retryCount: 0,
      tempPath: join(tempDir, `${index}.part`),
    };
  });
}

export function uniqueDestination(directory: string, fileName: string): string {
  const original = parse(fileName);
  let candidate = join(directory, fileName);
  let index = 2;
  while (existsSync(candidate) || existsSync(`${candidate}.fasthunter.part`)) {
    candidate = join(directory, `${original.name} (${index})${original.ext}`);
    index += 1;
  }
  return candidate;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  retries: number,
  delayMs: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      lastError = error;
      if (attempt < retries) await sleep(delayMs * 2 ** attempt);
    }
  }
  throw lastError;
}
