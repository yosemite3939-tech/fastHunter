import type {
  AppSettings,
  CreateDownloadInput,
  DesktopApi,
  DownloadRecord,
  DownloadSnapshot,
} from "@fasthunter/shared-types";

const now = new Date().toISOString();
const makeRecord = (record: Partial<DownloadRecord> & Pick<DownloadRecord, "id" | "fileName" | "url">): DownloadRecord => ({
  id: record.id,
  fileName: record.fileName,
  url: record.url,
  destination: record.destination ?? `C:\\Users\\Demo\\Downloads\\${record.fileName}`,
  tempDir: "",
  mimeType: record.mimeType ?? "application/octet-stream",
  category: record.category ?? "others",
  status: record.status ?? "queued",
  totalBytes: record.totalBytes ?? 0,
  downloadedBytes: record.downloadedBytes ?? 0,
  speedBytesPerSecond: record.speedBytesPerSecond ?? 0,
  averageSpeedBytesPerSecond: record.averageSpeedBytesPerSecond ?? 0,
  etaSeconds: record.etaSeconds ?? null,
  supportsRanges: record.supportsRanges ?? false,
  segmentCount: record.segmentCount ?? 1,
  retryCount: record.retryCount ?? 0,
  errorMessage: record.errorMessage ?? null,
  createdAt: now,
  updatedAt: now,
  completedAt: record.completedAt ?? null,
  chunks: record.chunks ?? [],
  logs: record.logs ?? [],
});

let demoDownloads: DownloadRecord[] = [
  makeRecord({
    id: "demo-1",
    fileName: "Sonoma_Aerial_Film_4K.mp4",
    url: "https://media.example.com/library/sonoma-aerial",
    category: "videos",
    status: "downloading",
    totalBytes: 3_840_000_000,
    downloadedBytes: 2_611_200_000,
    speedBytesPerSecond: 18_700_000,
    averageSpeedBytesPerSecond: 17_900_000,
    etaSeconds: 66,
    supportsRanges: true,
    segmentCount: 6,
  }),
  makeRecord({
    id: "demo-2",
    fileName: "Design_Resources_2026.zip",
    url: "https://assets.example.com/design/resources",
    category: "archives",
    status: "completed",
    totalBytes: 684_000_000,
    downloadedBytes: 684_000_000,
    supportsRanges: true,
    segmentCount: 6,
    completedAt: now,
  }),
  makeRecord({
    id: "demo-3",
    fileName: "Windows_Dev_Kit.iso",
    url: "https://downloads.example.com/windows/dev-kit",
    category: "apps",
    status: "failed",
    totalBytes: 5_200_000_000,
    downloadedBytes: 1_040_000_000,
    supportsRanges: true,
    segmentCount: 6,
    retryCount: 2,
    errorMessage: "The source URL has expired. Request a fresh link and retry.",
  }),
  makeRecord({
    id: "demo-4",
    fileName: "Ambient_Focus_Session.flac",
    url: "https://audio.example.com/focus/session",
    category: "music",
    status: "queued",
    totalBytes: 172_000_000,
    downloadedBytes: 0,
    supportsRanges: true,
    segmentCount: 4,
  }),
];

let demoSettings: AppSettings = {
  defaultDownloadFolder: "C:\\Users\\Demo\\Downloads",
  maxSimultaneousDownloads: 3,
  maxConnectionsPerDownload: 6,
  autoStartDownloads: true,
  askBeforeDownload: false,
  autoCategorize: true,
  retryCount: 3,
  retryDelayMs: 900,
  browserCaptureEnabled: false,
  defaultDownloader: false,
  extensionId: "",
  minimizeToTray: false,
  droneMode: false,
  theme: "system",
  transparentMode: false,
  notifications: true,
  soundOnCompletion: false,
  autoOpenCompletedFile: false,
  autoOpenFolder: false,
  clearCompletedDownloads: false,
  bandwidthLimitEnabled: false,
  bandwidthLimitBytesPerSecond: 0,
};

const listeners = new Set<(snapshot: DownloadSnapshot) => void>();
const snapshot = (): DownloadSnapshot => ({
  downloads: demoDownloads,
  aggregateSpeed: demoDownloads.reduce((total, item) => total + item.speedBytesPerSecond, 0),
});
const emit = () => listeners.forEach((listener) => listener(snapshot()));
const update = (id: string, changes: Partial<DownloadRecord>) => {
  demoDownloads = demoDownloads.map((item) => item.id === id ? { ...item, ...changes } : item);
  emit();
};

const fallbackApi: DesktopApi = {
  listDownloads: async () => snapshot(),
  createDownload: async (input: CreateDownloadInput) => {
    const name = new URL(input.url).pathname.split("/").pop() || "New download";
    const record = makeRecord({ id: crypto.randomUUID(), url: input.url, fileName: name, status: "queued" });
    demoDownloads = [record, ...demoDownloads];
    emit();
    return record;
  },
  pauseDownload: async (id) => update(id, { status: "paused", speedBytesPerSecond: 0 }),
  resumeDownload: async (id) => update(id, { status: "downloading", speedBytesPerSecond: 8_400_000 }),
  retryDownload: async (id) => update(id, { status: "queued", errorMessage: null }),
  cancelDownload: async (id) => update(id, { status: "cancelled", speedBytesPerSecond: 0 }),
  removeDownload: async (id) => {
    demoDownloads = demoDownloads.filter((item) => item.id !== id);
    emit();
  },
  openFile: async () => undefined,
  openFolder: async () => undefined,
  getSettings: async () => demoSettings,
  saveSettings: async (settings) => (demoSettings = settings),
  chooseDownloadFolder: async () => demoSettings.defaultDownloadFolder,
  chooseFile: async () => null,
  getPathForFile: () => "",
  setDefaultDownloader: async () => ({ ok: false, message: "Browser integration is unavailable in the demo build." }),
  onDownloadsUpdated: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const api = window.fasthunter ?? fallbackApi;
