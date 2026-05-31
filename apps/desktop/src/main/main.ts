import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { app, BrowserWindow, dialog, ipcMain, Menu, shell, Tray } from "electron";
import type { AppSettings, CreateDownloadInput } from "@fasthunter/shared-types";
import { DownloadEngine } from "@fasthunter/download-engine";
import { SettingsStore } from "./settings-store.js";
import { runNativeMessagingHost } from "./native-messaging.js";

if (process.argv.includes("--native-messaging") || process.argv.some((argument) => argument.startsWith("chrome-extension://"))) {
  app.whenReady().then(runNativeMessagingHost);
} else {
  process.on("unhandledRejection", (reason) => { console.error("FastHunter unhandled rejection:", reason); });
  process.on("uncaughtException", (error) => { console.error("FastHunter uncaught exception:", error); });
  let mainWindow: BrowserWindow | null = null;
  let engine: DownloadEngine;
  let settingsStore: SettingsStore;
  let tray: Tray | null = null;
  let isQuitting = false;
  const pendingUrls: string[] = [];
  const incomingUrlTimes: number[] = [];
  let ignoreIncomingUrlsUntil = 0;
  const gotLock = app.requestSingleInstanceLock();

  const normalizeHttpUrl = (value?: string) => {
    if (!value) return undefined;
    try {
      const url = new URL(decodeURIComponent(value));
      return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
    } catch {
      return undefined;
    }
  };

  const findUrlArgument = (argv: string[]) => {
    const inline = argv.find((argument) => argument.startsWith("--add-url="));
    if (inline) return normalizeHttpUrl(inline.slice("--add-url=".length));
    const position = argv.indexOf("--add-url");
    return position >= 0 ? normalizeHttpUrl(argv[position + 1]) : undefined;
  };

  const focusMainWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  const buildTrayMenu = () => {
    const downloads = engine ? engine.snapshot().downloads : [];
    const active = downloads.filter((d) => ["downloading", "probing", "merging"].includes(d.status)).length;
    const queued = downloads.filter((d) => d.status === "queued").length;
    const paused = downloads.filter((d) => d.status === "paused").length;
    return Menu.buildFromTemplate([
      { label: `FastHunter — ${active} active · ${queued} queued`, enabled: false },
      { type: "separator" },
      { label: "Show window", click: () => focusMainWindow() },
      { label: "Pause all", enabled: active > 0, click: () => { for (const d of downloads) if (["downloading", "probing", "merging"].includes(d.status)) void engine.pause(d.id); } },
      { label: "Resume all", enabled: paused + queued > 0, click: () => { for (const d of downloads) if (["paused", "queued"].includes(d.status)) void engine.resume(d.id); } },
      { type: "separator" },
      { label: "Quit FastHunter", click: () => { isQuitting = true; app.quit(); } },
    ]);
  };

  const createTray = () => {
    if (tray) return;
    const iconDir = join(process.resourcesPath, "icons");
    const iconPath = existsSync(join(iconDir, "icon.ico")) ? join(iconDir, "icon.ico") : join(iconDir, "icon.png");
    try {
      tray = new Tray(iconPath);
      tray.setToolTip("FastHunter Downloader");
      tray.on("click", () => focusMainWindow());
      tray.on("double-click", () => focusMainWindow());
      tray.on("right-click", () => tray?.popUpContextMenu(buildTrayMenu()));
    } catch { /* tray unavailable */ }
  };

  const enqueueUrl = async (url?: string) => {
    if (!url) return;
    const now = Date.now();
    if (now < ignoreIncomingUrlsUntil) return;
    while (incomingUrlTimes.length && incomingUrlTimes[0] < now - 3_000) incomingUrlTimes.shift();
    incomingUrlTimes.push(now);
    if (incomingUrlTimes.length > 5) {
      ignoreIncomingUrlsUntil = now + 30_000;
      console.warn("Ignored a burst of browser download URLs. Reload the browser extension before retrying.");
      return;
    }
    if (!engine) {
      pendingUrls.push(url);
      return;
    }
    if (settingsStore.get().askBeforeDownload) {
      const result = await dialog.showMessageBox({ type: "question", buttons: ["Download", "Cancel"], defaultId: 0, cancelId: 1, message: "Download this file?", detail: url });
      if (result.response !== 0) return;
    }
    await engine.createDownload({ url });
    focusMainWindow();
  };

  const execFileAsync = promisify(execFile);
  const NATIVE_HOST = "com.fasthunter.downloader";
  const EXTENSION_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtgjpfDDYzpArOhFdXyXVtKK32rbiqKgMhsjnGl9w88SdG7ScSSFjcHt/pvBaJneHUBu/O1tt5JEIwoV3FzS1TQV25qNrd8QBHBmTlH1Zpwv6OimaUTOB0REwJFLPnKg9c3NrCUSZ9SFHlyR1oYavyeG7nCaCnuJNIx0UVfaU3KXUYtdgA4IzxwPdUot8wsNfZPQFHjlpuvMXk04hjQwztS0iP78ZPLf03a2uMBpIEY/H1U0Zgsg7VO9cx37MzhUQkjF8/oTR+0L1OUWqwU4CxsgCFDU0hZgxvXYxuq1+rI/e0pIQXGlpgmrvEIc8I05TpuqXJ0rHQlsnV1TxZj6FAwIDAQAB";
  const EXTENSION_ID = createHash("sha256").update(Buffer.from(EXTENSION_KEY, "base64")).digest("hex").slice(0, 32).replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + Number.parseInt(c, 16)));
  const NATIVE_HOST_KEYS = [
    `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${NATIVE_HOST}`,
    `HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${NATIVE_HOST}`,
    `HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\${NATIVE_HOST}`,
  ];

  const setDefaultDownloader = async (enable: boolean): Promise<{ ok: boolean; message: string }> => {
    if (process.platform !== "win32") {
      return { ok: false, message: "Default downloader integration is currently available on Windows only." };
    }
    const manifestPath = join(app.getPath("userData"), "native-messaging-host.json");
    try {
      if (enable) {
        const ids = new Set([EXTENSION_ID]);
        const custom = settingsStore.get().extensionId?.trim();
        if (custom) ids.add(custom);
        const manifest = {
          name: NATIVE_HOST,
          description: "FastHunter Downloader native messaging host",
          path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath,
          type: "stdio",
          allowed_origins: [...ids].map((id) => `chrome-extension://${id}/`),
        };
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        for (const key of NATIVE_HOST_KEYS) {
          await execFileAsync("reg", ["add", key, "/ve", "/t", "REG_SZ", "/d", manifestPath, "/f"]);
        }
        return { ok: true, message: `FastHunter registered with Chrome, Edge & Brave. Open your browser and enable the FastHunter extension (id ${EXTENSION_ID.slice(0, 10)}…) to finish.` };
      }
      for (const key of NATIVE_HOST_KEYS) {
        await execFileAsync("reg", ["delete", key, "/f"]).catch(() => undefined);
      }
      return { ok: true, message: "FastHunter removed as the browser's default downloader." };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Could not update browser integration." };
    }
  };

  if (!gotLock) {
    app.quit();
  } else {
    app.on("second-instance", (_event, argv) => {
      focusMainWindow();
      void enqueueUrl(findUrlArgument(argv));
    });
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
    app.on("before-quit", () => { isQuitting = true; });
    app.whenReady().then(async () => {
      const dataRoot = app.getPath("userData");
      settingsStore = new SettingsStore(join(dataRoot, "settings.json"));
      const settings = await settingsStore.load();
      if (settings.defaultDownloader) void setDefaultDownloader(true);
      engine = await DownloadEngine.create(
        join(dataRoot, "fasthunter.sqlite"),
        join(dataRoot, "temporary-downloads"),
        settings,
      );

      const windowStatePath = join(dataRoot, "window.json");
      let savedBounds: { x?: number; y?: number; width?: number; height?: number } | undefined;
      try { savedBounds = JSON.parse(readFileSync(windowStatePath, "utf8")); } catch { savedBounds = undefined; }

      mainWindow = new BrowserWindow({
        width: savedBounds?.width ?? 1500,
        height: savedBounds?.height ?? 940,
        x: savedBounds?.x,
        y: savedBounds?.y,
        minWidth: 1120,
        minHeight: 720,
        frame: false,
        transparent: false,
        backgroundColor: "#000000",
        titleBarStyle: "hidden",
        webPreferences: {
          preload: join(__dirname, "../preload/preload.js"),
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      const persistBounds = () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          try { writeFileSync(windowStatePath, JSON.stringify(mainWindow.getBounds())); } catch { /* ignore */ }
        }
      };
      mainWindow.on("resized", persistBounds);
      mainWindow.on("moved", persistBounds);
      mainWindow.on("close", (event) => {
        persistBounds();
        if (settingsStore.get().minimizeToTray && !isQuitting && tray) {
          event.preventDefault();
          mainWindow?.hide();
        }
      });
      mainWindow.on("closed", () => {
        mainWindow = null;
      });
      createTray();

      mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      mainWindow.webContents.on("will-navigate", (event) => {
        if (!process.env.VITE_DEV_SERVER_URL) event.preventDefault();
      });

      if (process.env.VITE_DEV_SERVER_URL) {
        await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      } else {
        await mainWindow.loadFile(join(__dirname, "../../renderer/index.html"));
      }

      engine.on("updated", (snapshot) => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("downloads:updated", snapshot);
      });
      ipcMain.handle("downloads:list", () => engine.snapshot());
      ipcMain.handle("downloads:create", (_event, input: CreateDownloadInput) => engine.createDownload(input));
      ipcMain.handle("downloads:pause", (_event, id: string) => engine.pause(id));
      ipcMain.handle("downloads:resume", (_event, id: string) => engine.resume(id));
      ipcMain.handle("downloads:retry", (_event, id: string) => engine.retry(id));
      ipcMain.handle("downloads:cancel", (_event, id: string) => engine.cancel(id));
      ipcMain.handle("downloads:remove", (_event, id: string) => engine.remove(id));
      ipcMain.handle("downloads:open-file", (_event, id: string) => {
        const item = engine.get(id);
        return item ? shell.openPath(item.destination) : undefined;
      });
      ipcMain.handle("downloads:open-folder", (_event, id: string) => {
        const item = engine.get(id);
        if (item) shell.showItemInFolder(item.destination);
      });
      ipcMain.handle("settings:get", () => settingsStore.get());
      ipcMain.handle("settings:save", async (_event, next: AppSettings) => {
        const saved = await settingsStore.save(next);
        engine.updateSettings(saved);
        if (saved.defaultDownloader) void setDefaultDownloader(true);
        return saved;
      });
      ipcMain.handle("settings:choose-folder", async () => {
        const result = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
        return result.canceled ? null : result.filePaths[0];
      });
      ipcMain.handle("dialog:open-file", async () => {
        const result = await dialog.showOpenDialog({ properties: ["openFile"], filters: [{ name: "Torrent", extensions: ["torrent"] }, { name: "All files", extensions: ["*"] }] });
        return result.canceled ? null : result.filePaths[0];
      });
      ipcMain.handle("integration:set-default-downloader", (_event, enable: boolean) => setDefaultDownloader(enable));
      ipcMain.on("window:minimize", () => mainWindow?.minimize());
      ipcMain.on("window:maximize", () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
      ipcMain.on("window:close", () => mainWindow?.close());

      await enqueueUrl(findUrlArgument(process.argv));
      for (const url of pendingUrls.splice(0)) await enqueueUrl(url);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(message);
      dialog.showErrorBox("FastHunter Downloader could not start", message);
      app.quit();
    });
  }
}
