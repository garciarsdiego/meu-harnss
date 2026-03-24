import { useCallback, useEffect, useRef, useState } from "react";
import type { PalConfig, PalConnectionResult } from "../../../../../shared/types/pal";

export type PalStatus = "online" | "offline" | "unconfigured";

interface PalStatusState {
  status: PalStatus;
  latencyMs: number | null;
  isWizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

declare global {
  interface Window {
    ipc: {
      invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
    };
  }
}

const POLL_INTERVAL_MS = 30_000;

export function usePalStatus(): PalStatusState {
  const [status, setStatus] = useState<PalStatus>("unconfigured");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [config, setConfig] = useState<PalConfig | null>(null);
  const cancelledRef = useRef(false);

  const testConnection = useCallback(async (url: string) => {
    try {
      const result = await window.ipc.invoke<PalConnectionResult>(
        "mh:pal:test-connection",
        { url }
      );
      if (cancelledRef.current) return;
      if (result.ok) {
        setStatus("online");
        setLatencyMs(result.latencyMs ?? null);
      } else {
        setStatus("offline");
        setLatencyMs(null);
      }
    } catch {
      if (!cancelledRef.current) {
        setStatus("offline");
        setLatencyMs(null);
      }
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    async function init() {
      try {
        const cfg = await window.ipc.invoke<PalConfig | null>("mh:pal:get-config");
        if (cancelledRef.current) return;
        if (!cfg?.litellmProxyUrl) {
          setStatus("unconfigured");
          return;
        }
        setConfig(cfg);
        await testConnection(cfg.litellmProxyUrl);
      } catch {
        if (!cancelledRef.current) setStatus("unconfigured");
      }
    }

    void init();

    return () => {
      cancelledRef.current = true;
    };
  }, [testConnection]);

  // Poll every 30s when configured
  useEffect(() => {
    if (!config?.litellmProxyUrl) return;
    const id = setInterval(() => {
      void testConnection(config.litellmProxyUrl);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [config, testConnection]);

  return {
    status,
    latencyMs,
    isWizardOpen,
    openWizard: () => setIsWizardOpen(true),
    closeWizard: () => setIsWizardOpen(false),
  };
}
