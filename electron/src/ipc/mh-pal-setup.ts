import { ipcMain, type IpcMainInvokeEvent } from "electron";

import { getMhPalConfigPath } from "../lib/mh-data-dir";
import { readJson, writeJson } from "../lib/mh-json-store";
import type { PalConfig, PalConnectionResult } from "../../../shared/types/pal";

export function registerMhPalSetupHandlers(): void {
  ipcMain.handle("mh:pal:get-config", async (): Promise<PalConfig | null> => {
    return readJson<PalConfig>(getMhPalConfigPath(), null as unknown as PalConfig);
  });

  // Only persists litellmProxyUrl and defaultModel — API keys never written to disk
  ipcMain.handle(
    "mh:pal:save-config",
    async (
      _event: IpcMainInvokeEvent,
      incoming: Omit<PalConfig, "isConfigured">
    ): Promise<PalConfig> => {
      const config: PalConfig = {
        litellmProxyUrl: incoming.litellmProxyUrl,
        defaultModel: incoming.defaultModel,
        isConfigured: true,
      };
      await writeJson(getMhPalConfigPath(), config);
      return config;
    }
  );

  ipcMain.handle("mh:pal:detect", async (): Promise<boolean> => {
    const config = await readJson<PalConfig | null>(getMhPalConfigPath(), null);
    return (
      config !== null &&
      typeof config.litellmProxyUrl === "string" &&
      config.litellmProxyUrl.length > 0
    );
  });

  ipcMain.handle(
    "mh:pal:test-connection",
    async (
      _event: IpcMainInvokeEvent,
      { url }: { url: string }
    ): Promise<PalConnectionResult> => {
      const start = Date.now();
      try {
        // /health/liveliness is unauthenticated — just checks if the process is up
        const response = await fetch(`${url}/health/liveliness`, {
          signal: AbortSignal.timeout(5_000),
        });
        const latencyMs = Date.now() - start;
        if (!response.ok) {
          return { ok: false, latencyMs, error: `HTTP ${response.status}` };
        }
        return { ok: true, latencyMs };
      } catch (err) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  );
}
