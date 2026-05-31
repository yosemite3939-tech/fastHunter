import { describe, expect, it, vi } from "vitest";
import {
  calculateChunks,
  categorizeFile,
  detectFileName,
  supportsByteRanges,
  TaskQueue,
  withRetry,
} from "../src/index.js";
import { readTotalBytes, uniqueDestination } from "../src/utils.js";
import { dedupeSources, extractSupportedSources, isSupportedSource } from "@fasthunter/shared-types";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as pathJoin } from "node:path";

describe("download metadata", () => {
  it("prefers Content-Disposition filenames", () => {
    expect(detectFileName("https://example.com/raw?id=1", "attachment; filename=\"Quarterly Report.pdf\""))
      .toBe("Quarterly Report.pdf");
  });

  it("decodes RFC 5987 filenames", () => {
    expect(detectFileName("https://example.com/raw", "attachment; filename*=UTF-8''Hyper%20Lapse.zip"))
      .toBe("Hyper Lapse.zip");
  });

  it("detects range support", () => {
    expect(supportsByteRanges(new Headers({ "Accept-Ranges": "bytes" }))).toBe(true);
    expect(supportsByteRanges(new Headers(), 206)).toBe(true);
    expect(supportsByteRanges(new Headers())).toBe(false);
  });
});

describe("chunk calculation", () => {
  it("covers every byte exactly once", () => {
    const chunks = calculateChunks("d", 10 * 1024 * 1024, 4, "tmp");
    expect(chunks).toHaveLength(4);
    expect(chunks[0].start).toBe(0);
    expect(chunks.at(-1)?.end).toBe(10 * 1024 * 1024 - 1);
    for (let index = 1; index < chunks.length; index += 1) {
      expect(chunks[index].start).toBe(chunks[index - 1].end + 1);
    }
  });

  it("does not create tiny segments", () => {
    expect(calculateChunks("d", 600_000, 8, "tmp")).toHaveLength(1);
  });
});

describe("categories", () => {
  it("uses MIME and extension detection", () => {
    expect(categorizeFile("movie.bin", "video/mp4")).toBe("videos");
    expect(categorizeFile("archive.7z")).toBe("archives");
    expect(categorizeFile("setup.msi")).toBe("apps");
  });
});

describe("retry behavior", () => {
  it("retries transient failures", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue("ok");
    await expect(withRetry(operation, 2, 1)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry aborted operations", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    const operation = vi.fn().mockRejectedValue(abortError);
    await expect(withRetry(operation, 3, 1)).rejects.toBe(abortError);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe("queue behavior", () => {
  it("limits concurrent tasks and continues in FIFO order", () => {
    const queue = new TaskQueue(1);
    queue.enqueue("first");
    queue.enqueue("second");
    expect(queue.next()).toBe("first");
    expect(queue.next()).toBeUndefined();
    queue.complete("first");
    expect(queue.next()).toBe("second");
  });
});

describe("byte totals", () => {
  it("reads total from content-range", () => {
    expect(readTotalBytes(new Headers({ "Content-Range": "bytes 0-0/12345" }))).toBe(12345);
  });
  it("falls back to content-length", () => {
    expect(readTotalBytes(new Headers({ "Content-Length": "678" }))).toBe(678);
  });
});

describe("destination resolution", () => {
  it("does not overwrite an existing file", () => {
    const dir = mkdtempSync(pathJoin(tmpdir(), "fh-"));
    expect(uniqueDestination(dir, "a.txt")).toBe(pathJoin(dir, "a.txt"));
    writeFileSync(pathJoin(dir, "a.txt"), "x");
    expect(uniqueDestination(dir, "a.txt")).toBe(pathJoin(dir, "a (2).txt"));
  });
});

describe("drop sources", () => {
  it("accepts direct http and https sources", () => {
    expect(isSupportedSource("https://x.com/a.zip")).toBe(true);
    expect(isSupportedSource("http://x.com")).toBe(true);
  });
  it("rejects protocols and files the HTTP engine cannot download", () => {
    expect(isSupportedSource("magnet:?xt=urn:btih:abc")).toBe(false);
    expect(isSupportedSource("C:\\downloads\\file.torrent")).toBe(false);
    expect(isSupportedSource("/home/u/file.torrent")).toBe(false);
    expect(isSupportedSource("ftp://x.com/a")).toBe(false);
    expect(isSupportedSource("file:///x.torrent")).toBe(false);
    expect(isSupportedSource("C:\\downloads\\movie.zip")).toBe(false);
    expect(isSupportedSource("just some text")).toBe(false);
    expect(isSupportedSource("")).toBe(false);
  });
  it("trims and removes duplicates across multiple inputs", () => {
    expect(dedupeSources([" https://a ", "https://a", "https://b", "  ", "https://b"]))
      .toEqual(["https://a", "https://b"]);
  });
  it("extracts links from browser drag payload formats", () => {
    expect(extractSupportedSources([
      "# text/uri-list comment\nhttps://x.com/a.zip",
      "<a href=\"https://x.com/b.iso\">download</a>",
      "application/octet-stream:file.zip:https://x.com/c.zip",
      "https://x.com/a.zip",
    ])).toEqual([
      "https://x.com/a.zip",
      "https://x.com/b.iso",
      "https://x.com/c.zip",
    ]);
  });
});
