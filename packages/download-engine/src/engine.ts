import { EventEmitter } from "node:events";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, open, rename, rm, stat, statfs } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import type {
  AppSettings,
  ChunkRecord,
  CreateDownloadInput,
  DownloadLog,
  DownloadRecord,
  DownloadSnapshot,
} from "@fasthunter/shared-types";
import { DownloadRepository } from "./repository.js";
import { probeRemote } from "./probe.js";
import { TaskQueue } from "./task-queue.js";
import {
  calculateChunks,
  categorizeFile,
  sleep,
  uniqueDestination,
  withRetry,
} from "./utils.js";

interface RunningTask {
  controller: AbortController;
  startedAt: number;
  initialBytes: number;
  lastPersistedAt: number;
  lastSampleAt: number;
  lastSampleBytes: number;
}

export class DownloadEngine extends EventEmitter {
  private readonly running = new Map<string, RunningTask>();
  private readonly queue: TaskQueue;
  private bandwidthWindowStart = Date.now();
  private bandwidthWindowBytes = 0;
  private throttleGate = Promise.resolve();

  private constructor(
    private readonly repository: DownloadRepository,
    private settings: AppSettings,
    private readonly tempRoot: string,
  ) {
    super();
    this.queue = new TaskQueue(settings.maxSimultaneousDownloads);
  }

  static async create(databasePath: string, tempRoot: string, settings: AppSettings): Promise<DownloadEngine> {
    const repository = await DownloadRepository.open(databasePath);
    const engine = new DownloadEngine(repository, settings, tempRoot);
    for (const download of repository.list()) {
      if (["probing", "downloading", "merging"].includes(download.status)) {
        download.status = "paused";
        download.speedBytesPerSecond = 0;
        engine.addLog(download, "warn", "Recovered after application restart. Resume to continue.");
        await repository.save(download);
      }
      if (download.status === "queued" && settings.autoStartDownloads) engine.queue.enqueue(download.id);
    }
    engine.schedule();
    return engine;
  }

  snapshot(): DownloadSnapshot {
    const downloads = this.repository.list();
    return {
      downloads,
      aggregateSpeed: downloads.reduce((total, item) => total + item.speedBytesPerSecond, 0),
    };
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings;
    this.queue.setLimit(settings.maxSimultaneousDownloads);
    this.schedule();
  }

  async createDownload(input: CreateDownloadInput): Promise<DownloadRecord> {
    const duplicate = this.repository.list().find((download) =>
      download.url === input.url &&
      ["queued", "probing", "downloading", "merging"].includes(download.status) &&
      Date.now() - Date.parse(download.createdAt) < 30_000
    );
    if (duplicate) return duplicate;

    const now = new Date().toISOString();
    const id = randomUUID();
    const record: DownloadRecord = {
      id,
      url: input.url,
      fileName: "Preparing download...",
      destination: input.destinationDirectory ?? this.settings.defaultDownloadFolder,
      tempDir: join(this.tempRoot, id),
      mimeType: "application/octet-stream",
      category: "others",
      status: "queued",
      totalBytes: 0,
      downloadedBytes: 0,
      speedBytesPerSecond: 0,
      averageSpeedBytesPerSecond: 0,
      etaSeconds: null,
      supportsRanges: false,
      segmentCount: 0,
      retryCount: 0,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      chunks: [],
      logs: [],
    };
    this.addLog(record, "info", "Download added to queue.");
    await this.repository.save(record);
    if (this.settings.autoStartDownloads) {
      this.queue.enqueue(id);
      this.schedule();
    }
    this.broadcast();
    return record;
  }

  async pause(id: string): Promise<void> {
    this.running.get(id)?.controller.abort();
    this.queue.remove(id);
    const record = this.mustGet(id);
    if (!["completed", "cancelled"].includes(record.status)) {
      record.status = "paused";
      record.speedBytesPerSecond = 0;
      this.addLog(record, "info", "Download paused.");
      await this.repository.save(record);
      this.broadcast();
    }
  }

  async resume(id: string): Promise<void> {
    const record = this.mustGet(id);
    if (record.status === "completed") return;
    record.status = "queued";
    record.errorMessage = null;
    this.addLog(record, "info", "Download queued to resume.");
    await this.repository.save(record);
    this.queue.enqueue(id);
    this.schedule();
    this.broadcast();
  }

  async retry(id: string): Promise<void> {
    const record = this.mustGet(id);
    record.retryCount += 1;
    record.status = "queued";
    record.errorMessage = null;
    this.addLog(record, "info", "Retry requested.");
    await this.repository.save(record);
    this.queue.enqueue(id);
    this.schedule();
    this.broadcast();
  }

  async cancel(id: string): Promise<void> {
    this.running.get(id)?.controller.abort();
    this.queue.remove(id);
    const record = this.mustGet(id);
    record.status = "cancelled";
    record.speedBytesPerSecond = 0;
    this.addLog(record, "warn", "Download cancelled.");
    await this.repository.save(record);
    await rm(record.tempDir, { recursive: true, force: true });
    this.broadcast();
  }

  async remove(id: string): Promise<void> {
    this.running.get(id)?.controller.abort();
    this.queue.remove(id);
    const record = this.mustGet(id);
    await rm(record.tempDir, { recursive: true, force: true });
    await this.repository.remove(id);
    this.broadcast();
  }

  get(id: string): DownloadRecord | undefined {
    return this.repository.get(id);
  }

  private schedule(): void {
    let nextId = this.queue.next();
    while (nextId) {
      const downloadId = nextId;
      void this.execute(downloadId).finally(() => {
        this.queue.complete(downloadId);
        this.schedule();
      });
      nextId = this.queue.next();
    }
  }

  private async execute(id: string): Promise<void> {
    const record = this.mustGet(id);
    const startedAt = Date.now();
    const running: RunningTask = {
      controller: new AbortController(),
      startedAt,
      initialBytes: record.downloadedBytes,
      lastPersistedAt: 0,
      lastSampleAt: startedAt,
      lastSampleBytes: record.downloadedBytes,
    };
    this.running.set(id, running);
    try {
      record.status = "probing";
      this.addLog(record, "info", "Checking server metadata and resume support.");
      await this.repository.save(record);
      this.broadcast();

      const metadata = await probeRemote(record.url, running.controller.signal);
      record.fileName = metadata.fileName;
      record.mimeType = metadata.mimeType;
      record.totalBytes = metadata.totalBytes;
      record.supportsRanges = metadata.supportsRanges && metadata.totalBytes > 0;
      record.category = categorizeFile(record.fileName, record.mimeType);
      if (!record.chunks.length) {
        record.destination = uniqueDestination(record.destination, record.fileName);
      }
      await mkdir(record.tempDir, { recursive: true });
      await mkdir(dirname(record.destination), { recursive: true });
      await this.ensureFreeSpace(record);

      if (record.supportsRanges) {
        if (!record.chunks.length) {
          record.chunks = calculateChunks(id, record.totalBytes, this.settings.maxConnectionsPerDownload, record.tempDir);
        }
        record.segmentCount = record.chunks.length;
        this.addLog(record, "info", `Server supports byte ranges. Downloading with ${record.segmentCount} segments.`);
        record.status = "downloading";
        await this.repository.save(record);
        await Promise.all(record.chunks.map((chunk) => this.downloadChunk(record, chunk, running)));
      } else {
        record.segmentCount = 1;
        record.chunks = [{
          id: `${id}-0`,
          downloadId: id,
          index: 0,
          start: 0,
          end: Math.max(0, record.totalBytes - 1),
          downloaded: 0,
          status: "queued",
          retryCount: 0,
          tempPath: join(record.tempDir, "0.part"),
        }];
        this.addLog(record, "warn", "Server does not support byte ranges. Using a single stream.");
        record.status = "downloading";
        await this.repository.save(record);
        await this.downloadChunk(record, record.chunks[0], running, false);
      }

      record.status = "merging";
      this.addLog(record, "info", "Combining downloaded segments.");
      await this.repository.save(record);
      this.broadcast();
      await this.merge(record);
      record.status = "completed";
      record.completedAt = new Date().toISOString();
      record.speedBytesPerSecond = 0;
      record.etaSeconds = 0;
      this.addLog(record, "info", "Download completed.");
      await this.repository.save(record);
      await rm(record.tempDir, { recursive: true, force: true });
    } catch (error) {
      if (running.controller.signal.aborted) return;
      running.controller.abort();
      record.status = "failed";
      record.speedBytesPerSecond = 0;
      record.errorMessage = error instanceof Error ? error.message : "Unknown download failure.";
      this.addLog(record, "error", record.errorMessage);
      await this.repository.save(record);
    } finally {
      this.running.delete(id);
      this.broadcast();
    }
  }

  private async downloadChunk(
    record: DownloadRecord,
    chunk: ChunkRecord,
    running: RunningTask,
    useRange = true,
  ): Promise<void> {
    await withRetry(async (attempt) => {
      if (attempt > 0) {
        chunk.retryCount += 1;
        this.addLog(record, "warn", `Retrying segment ${chunk.index + 1}, attempt ${attempt + 1}.`);
      }
      chunk.status = "downloading";
      if (!useRange && existsSync(chunk.tempPath)) {
        await rm(chunk.tempPath, { force: true });
        chunk.downloaded = 0;
      }
      if (existsSync(chunk.tempPath)) {
        const info = await stat(chunk.tempPath);
        const expected = chunk.end - chunk.start + 1;
        if (useRange && record.totalBytes > 0 && info.size > expected) {
          await rm(chunk.tempPath, { force: true });
          chunk.downloaded = 0;
        } else {
          chunk.downloaded = Math.min(info.size, expected);
        }
      }
      const offset = chunk.start + chunk.downloaded;
      if (offset > chunk.end && useRange) {
        chunk.status = "completed";
        return;
      }
      const response = await fetch(record.url, {
        headers: useRange ? { Range: `bytes=${offset}-${chunk.end}`, "Accept-Encoding": "identity" } : { "Accept-Encoding": "identity" },
        redirect: "follow",
        signal: running.controller.signal,
      });
      if (!response.ok || (useRange && response.status !== 206)) {
        throw new Error(`Server returned HTTP ${response.status} for segment ${chunk.index + 1}.`);
      }
      if (!response.body) throw new Error("Server returned an empty response body.");

      const handle = await open(chunk.tempPath, chunk.downloaded ? "a" : "w");
      try {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await handle.write(value);
          chunk.downloaded += value.byteLength;
          await this.updateProgress(record, running);
          await this.throttle(value.byteLength);
        }
      } finally {
        await handle.close();
      }
      const expected = chunk.end - chunk.start + 1;
      if (record.totalBytes > 0 && chunk.downloaded !== expected) {
        throw new Error(`Segment ${chunk.index + 1} ended early (${chunk.downloaded}/${expected} bytes).`);
      }
      chunk.status = "completed";
      await this.updateProgress(record, running, true);
    }, this.settings.retryCount, this.settings.retryDelayMs);
  }

  private async updateProgress(record: DownloadRecord, running: RunningTask, force = false): Promise<void> {
    const now = Date.now();
    record.downloadedBytes = record.chunks.reduce((total, chunk) => total + chunk.downloaded, 0);
    const elapsedSeconds = Math.max(0.1, (now - running.startedAt) / 1000);
    record.averageSpeedBytesPerSecond = (record.downloadedBytes - running.initialBytes) / elapsedSeconds;
    const sampleSeconds = (now - running.lastSampleAt) / 1000;
    if (sampleSeconds >= 0.5) {
      record.speedBytesPerSecond = Math.max(0, (record.downloadedBytes - running.lastSampleBytes) / sampleSeconds);
      running.lastSampleAt = now;
      running.lastSampleBytes = record.downloadedBytes;
    }
    record.etaSeconds = record.speedBytesPerSecond > 0 && record.totalBytes > 0
      ? Math.max(0, Math.round((record.totalBytes - record.downloadedBytes) / record.speedBytesPerSecond))
      : null;
    record.updatedAt = new Date().toISOString();
    if (force || now - running.lastPersistedAt > 450) {
      running.lastPersistedAt = now;
      await this.repository.save(record);
      this.broadcast();
    }
  }

  private async merge(record: DownloadRecord): Promise<void> {
    const partialPath = `${record.destination}.fasthunter.part`;
    await rm(partialPath, { force: true });
    for (const chunk of [...record.chunks].sort((a, b) => a.index - b.index)) {
      await pipeline(createReadStream(chunk.tempPath), createWriteStream(partialPath, { flags: "a" }));
    }
    if (record.totalBytes > 0) {
      const info = await stat(partialPath);
      if (info.size !== record.totalBytes) throw new Error("Merged file size does not match the server metadata.");
    }
    await rename(partialPath, record.destination);
  }

  private async ensureFreeSpace(record: DownloadRecord): Promise<void> {
    if (!record.totalBytes) return;
    const stats = await statfs(dirname(record.destination));
    const available = stats.bavail * stats.bsize;
    const reservedByOthers = this.repository.list()
      .filter((other) => other.id !== record.id && this.running.has(other.id) && other.totalBytes > 0)
      .reduce((sum, other) => sum + Math.max(0, other.totalBytes - other.downloadedBytes), 0);
    if (available < record.totalBytes - record.downloadedBytes + reservedByOthers) {
      throw new Error("Not enough free disk space for this download.");
    }
  }

  private async throttle(bytes: number): Promise<void> {
    const limit = this.settings.droneMode
      ? 1_572_864
      : (this.settings.bandwidthLimitEnabled ? this.settings.bandwidthLimitBytesPerSecond : 0);
    if (limit <= 0) return;
    const run = this.throttleGate.then(async () => {
      if (Date.now() - this.bandwidthWindowStart >= 1000) {
        this.bandwidthWindowStart = Date.now();
        this.bandwidthWindowBytes = 0;
      }
      this.bandwidthWindowBytes += bytes;
      const expectedElapsed = (this.bandwidthWindowBytes / limit) * 1000;
      const actualElapsed = Date.now() - this.bandwidthWindowStart;
      if (expectedElapsed > actualElapsed) await sleep(expectedElapsed - actualElapsed);
    });
    this.throttleGate = run.catch(() => {});
    return run;
  }

  private mustGet(id: string): DownloadRecord {
    const record = this.repository.get(id);
    if (!record) throw new Error(`Download ${id} was not found.`);
    return record;
  }

  private addLog(record: DownloadRecord, level: DownloadLog["level"], message: string): void {
    record.logs = [
      ...record.logs,
      { id: randomUUID(), downloadId: record.id, level, message, createdAt: new Date().toISOString() },
    ].slice(-100);
    record.updatedAt = new Date().toISOString();
  }

  private broadcast(): void {
    this.emit("updated", this.snapshot());
  }
}
