import { homedir } from "node:os";
import { join } from "node:path";
import type { AppSettings } from "@fasthunter/shared-types";

export const DEFAULT_SETTINGS: AppSettings = {
  defaultDownloadFolder: join(homedir(), "Downloads"),
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
  theme: "dark",
  transparentMode: false,
  notifications: true,
  soundOnCompletion: false,
  autoOpenCompletedFile: false,
  autoOpenFolder: false,
  clearCompletedDownloads: false,
  bandwidthLimitEnabled: false,
  bandwidthLimitBytesPerSecond: 0,
};
