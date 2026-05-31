export type DownloadStatus =
  | "queued"
  | "probing"
  | "downloading"
  | "paused"
  | "merging"
  | "completed"
  | "failed"
  | "cancelled";

export type DownloadCategory =
  | "videos"
  | "music"
  | "documents"
  | "images"
  | "archives"
  | "apps"
  | "others";

export interface ChunkRecord {
  id: string;
  downloadId: string;
  index: number;
  start: number;
  end: number;
  downloaded: number;
  status: "queued" | "downloading" | "completed" | "failed";
  retryCount: number;
  tempPath: string;
}

export interface DownloadLog {
  id: string;
  downloadId: string;
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
}

export interface DownloadRecord {
  id: string;
  url: string;
  fileName: string;
  destination: string;
  tempDir: string;
  mimeType: string;
  category: DownloadCategory;
  status: DownloadStatus;
  totalBytes: number;
  downloadedBytes: number;
  speedBytesPerSecond: number;
  averageSpeedBytesPerSecond: number;
  etaSeconds: number | null;
  supportsRanges: boolean;
  segmentCount: number;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  chunks: ChunkRecord[];
  logs: DownloadLog[];
}

export interface DownloadSnapshot {
  downloads: DownloadRecord[];
  aggregateSpeed: number;
}

export interface CreateDownloadInput {
  url: string;
  destinationDirectory?: string;
}

export interface AppSettings {
  defaultDownloadFolder: string;
  maxSimultaneousDownloads: number;
  maxConnectionsPerDownload: number;
  autoStartDownloads: boolean;
  askBeforeDownload: boolean;
  autoCategorize: boolean;
  retryCount: number;
  retryDelayMs: number;
  browserCaptureEnabled: boolean;
  defaultDownloader: boolean;
  extensionId: string;
  minimizeToTray: boolean;
  droneMode: boolean;
  theme: "system" | "light" | "dark";
  transparentMode: boolean;
  notifications: boolean;
  soundOnCompletion: boolean;
  autoOpenCompletedFile: boolean;
  autoOpenFolder: boolean;
  clearCompletedDownloads: boolean;
  bandwidthLimitEnabled: boolean;
  bandwidthLimitBytesPerSecond: number;
}

export interface DesktopApi {
  listDownloads(): Promise<DownloadSnapshot>;
  createDownload(input: CreateDownloadInput): Promise<DownloadRecord>;
  pauseDownload(id: string): Promise<void>;
  resumeDownload(id: string): Promise<void>;
  retryDownload(id: string): Promise<void>;
  cancelDownload(id: string): Promise<void>;
  removeDownload(id: string): Promise<void>;
  openFile(id: string): Promise<void>;
  openFolder(id: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
  chooseDownloadFolder(): Promise<string | null>;
  chooseFile(): Promise<string | null>;
  getPathForFile(file: File): string;
  setDefaultDownloader(enable: boolean): Promise<{ ok: boolean; message: string }>;
  onDownloadsUpdated(callback: (snapshot: DownloadSnapshot) => void): () => void;
}

declare global {
  interface Window {
    fasthunter?: DesktopApi;
  }
}

export function isSupportedSource(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    if (["http:", "https:"].includes(new URL(v).protocol)) return true;
  } catch { /* not a URL */ }
  return false;
}

export function extractSupportedSources(values: string[]): string[] {
  const candidates: string[] = [];
  for (const raw of values) {
    for (const line of raw.split(/\r?\n/)) {
      const value = line.trim();
      if (!value || value.startsWith("#")) continue;
      if (isSupportedSource(value)) {
        candidates.push(value);
        continue;
      }
      for (const match of value.matchAll(/https?:\/\/[^\s<>"']+/gi)) {
        candidates.push(match[0]);
      }
    }
  }
  return dedupeSources(candidates);
}

export function dedupeSources(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}
