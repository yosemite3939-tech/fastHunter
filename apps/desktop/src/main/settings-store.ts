import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AppSettings } from "@fasthunter/shared-types";
import { DEFAULT_SETTINGS } from "@fasthunter/download-engine";

export class SettingsStore {
  private settings: AppSettings = DEFAULT_SETTINGS;

  constructor(private readonly filePath: string) {}

  async load(): Promise<AppSettings> {
    try {
      const saved = JSON.parse(await readFile(this.filePath, "utf8")) as Partial<AppSettings>;
      this.settings = { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      this.settings = DEFAULT_SETTINGS;
    }
    return this.settings;
  }

  get(): AppSettings {
    return this.settings;
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    this.settings = settings;
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(settings, null, 2));
    return settings;
  }
}
