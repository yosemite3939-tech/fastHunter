import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { AppSettings, CreateDownloadInput, DesktopApi, DownloadSnapshot } from "@fasthunter/shared-types";

const api: DesktopApi = {
  listDownloads: () => ipcRenderer.invoke("downloads:list"),
  createDownload: (input: CreateDownloadInput) => ipcRenderer.invoke("downloads:create", input),
  pauseDownload: (id: string) => ipcRenderer.invoke("downloads:pause", id),
  resumeDownload: (id: string) => ipcRenderer.invoke("downloads:resume", id),
  retryDownload: (id: string) => ipcRenderer.invoke("downloads:retry", id),
  cancelDownload: (id: string) => ipcRenderer.invoke("downloads:cancel", id),
  removeDownload: (id: string) => ipcRenderer.invoke("downloads:remove", id),
  openFile: (id: string) => ipcRenderer.invoke("downloads:open-file", id),
  openFolder: (id: string) => ipcRenderer.invoke("downloads:open-folder", id),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke("settings:save", settings),
  chooseDownloadFolder: () => ipcRenderer.invoke("settings:choose-folder"),
  chooseFile: () => ipcRenderer.invoke("dialog:open-file"),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  setDefaultDownloader: (enable: boolean) => ipcRenderer.invoke("integration:set-default-downloader", enable),
  onDownloadsUpdated: (callback: (snapshot: DownloadSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: DownloadSnapshot) => callback(snapshot);
    ipcRenderer.on("downloads:updated", listener);
    return () => ipcRenderer.removeListener("downloads:updated", listener);
  },
};

contextBridge.exposeInMainWorld("fasthunter", api);
contextBridge.exposeInMainWorld("fasthunterWindow", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
});
