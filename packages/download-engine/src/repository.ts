import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createRequire } from "node:module";
import initSqlJs, { type Database } from "sql.js";
import type { DownloadRecord } from "@fasthunter/shared-types";

const require = createRequire(__filename);

function rowToDownload(row: Record<string, unknown>): DownloadRecord {
  return {
    id: String(row.id),
    url: String(row.url),
    fileName: String(row.file_name),
    destination: String(row.destination),
    tempDir: String(row.temp_dir),
    mimeType: String(row.mime_type),
    category: row.category as DownloadRecord["category"],
    status: row.status as DownloadRecord["status"],
    totalBytes: Number(row.total_bytes),
    downloadedBytes: Number(row.downloaded_bytes),
    speedBytesPerSecond: Number(row.speed_bps),
    averageSpeedBytesPerSecond: Number(row.average_speed_bps),
    etaSeconds: row.eta_seconds === null ? null : Number(row.eta_seconds),
    supportsRanges: Boolean(row.supports_ranges),
    segmentCount: Number(row.segment_count),
    retryCount: Number(row.retry_count),
    errorMessage: row.error_message === null ? null : String(row.error_message),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: row.completed_at === null ? null : String(row.completed_at),
    chunks: JSON.parse(String(row.chunks_json)),
    logs: JSON.parse(String(row.logs_json)),
  };
}

export class DownloadRepository {
  private pendingFlush = Promise.resolve();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(private readonly db: Database, private readonly databasePath: string) {}

  static async open(databasePath: string): Promise<DownloadRepository> {
    const SQL = await initSqlJs({
      locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
    });
    let bytes: Uint8Array | undefined;
    try {
      bytes = await readFile(databasePath);
    } catch {
      bytes = undefined;
    }
    const db = new SQL.Database(bytes);
    db.run(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        file_name TEXT NOT NULL,
        destination TEXT NOT NULL,
        temp_dir TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        total_bytes INTEGER NOT NULL,
        downloaded_bytes INTEGER NOT NULL,
        speed_bps INTEGER NOT NULL,
        average_speed_bps INTEGER NOT NULL,
        eta_seconds INTEGER,
        supports_ranges INTEGER NOT NULL,
        segment_count INTEGER NOT NULL,
        retry_count INTEGER NOT NULL,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        chunks_json TEXT NOT NULL,
        logs_json TEXT NOT NULL
      );
    `);
    const repository = new DownloadRepository(db, databasePath);
    await repository.flushNow();
    return repository;
  }

  list(): DownloadRecord[] {
    const statement = this.db.prepare("SELECT * FROM downloads ORDER BY created_at DESC");
    const records: DownloadRecord[] = [];
    while (statement.step()) records.push(rowToDownload(statement.getAsObject()));
    statement.free();
    return records;
  }

  get(id: string): DownloadRecord | undefined {
    const statement = this.db.prepare("SELECT * FROM downloads WHERE id = ?");
    statement.bind([id]);
    const record = statement.step() ? rowToDownload(statement.getAsObject()) : undefined;
    statement.free();
    return record;
  }

  async save(record: DownloadRecord): Promise<void> {
    this.db.run(
      `INSERT OR REPLACE INTO downloads VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        record.id, record.url, record.fileName, record.destination, record.tempDir,
        record.mimeType, record.category, record.status, record.totalBytes,
        record.downloadedBytes, Math.round(record.speedBytesPerSecond),
        Math.round(record.averageSpeedBytesPerSecond), record.etaSeconds,
        record.supportsRanges ? 1 : 0, record.segmentCount, record.retryCount,
        record.errorMessage, record.createdAt, record.updatedAt, record.completedAt,
        JSON.stringify(record.chunks), JSON.stringify(record.logs),
      ],
    );
    this.scheduleFlush();
  }

  async remove(id: string): Promise<void> {
    this.db.run("DELETE FROM downloads WHERE id = ?", [id]);
    await this.flushNow();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flushNow();
    }, 1500);
  }

  private async flushNow(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pendingFlush = this.pendingFlush
      .catch(() => undefined)
      .then(() => this.writeDatabase())
      .catch((error) => { console.error("FastHunter: failed to persist download state", error); });
    return this.pendingFlush;
  }

  private async writeDatabase(): Promise<void> {
    await mkdir(dirname(this.databasePath), { recursive: true });
    const temporaryPath = `${this.databasePath}.tmp`;
    await writeFile(temporaryPath, this.db.export());
    await rename(temporaryPath, this.databasePath);
  }
}
