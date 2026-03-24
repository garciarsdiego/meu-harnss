import { useState, useEffect } from "react";
import type { PalConfig, PalConnectionResult } from "../../../../shared/types/pal";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

const DEFAULT_URL = "http://localhost:4000";

export function PalSetupWizard({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState(DEFAULT_URL);
  const [defaultModel, setDefaultModel] = useState("auto");
  const [isDetected, setIsDetected] = useState(false);
  const [testResult, setTestResult] = useState<PalConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-init every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTestResult(null);

    window.ipc
      .invoke<PalConfig | null>("mh:pal:get-config")
      .then((cfg) => {
        if (cfg?.litellmProxyUrl) {
          setUrl(cfg.litellmProxyUrl);
          setDefaultModel(cfg.defaultModel ?? "auto");
          setIsDetected(true);
        } else {
          setIsDetected(false);
        }
      })
      .catch(() => setIsDetected(false));
  }, [open]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.ipc.invoke<PalConnectionResult>(
        "mh:pal:test-connection",
        { url }
      );
      setTestResult(result);
    } catch (e) {
      setTestResult({ ok: false, error: String(e) });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await window.ipc.invoke<PalConfig>("mh:pal:save-config", {
        litellmProxyUrl: url,
        defaultModel,
      });
      setStep(4);
    } catch (e) {
      alert(`Erro ao salvar: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const stepLabels = ["Detectar", "Configurar", "Testar", "Concluir"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Configurar PAL</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  step === i + 1
                    ? "bg-primary text-primary-foreground"
                    : step > i + 1
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Detectar */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isDetected
                ? "Configuração PAL encontrada."
                : "Nenhuma configuração PAL encontrada. Vamos configurar."}
            </p>
            <p className="text-xs text-muted-foreground">
              Localização: <code className="rounded bg-muted px-1">userData/meu-harnss/pal-config.json</code>
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {isDetected ? "Reconfigurar" : "Configurar"}
            </button>
          </div>
        )}

        {/* Step 2 — Configurar */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">URL do LiteLLM Proxy</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:4000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Modelo padrão</label>
              <input
                type="text"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                placeholder="auto"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">Use "auto" para seleção automática</p>
            </div>
            <button
              onClick={() => { void handleTest(); setStep(3); }}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Testar Conexão
            </button>
          </div>
        )}

        {/* Step 3 — Testar */}
        {step === 3 && (
          <div className="space-y-4">
            {testing && (
              <p className="text-sm text-muted-foreground">Testando conexão com {url}…</p>
            )}
            {testResult && (
              <div className={`rounded-lg p-3 text-sm ${testResult.ok ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                {testResult.ok
                  ? `Conexão OK — ${testResult.latencyMs}ms`
                  : `Erro: ${testResult.error ?? "sem resposta"}`}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { void handleTest(); }}
                disabled={testing}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm"
              >
                Testar novamente
              </button>
              <button
                onClick={() => { void handleSave(); }}
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Concluir */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-2xl">
              ✓
            </div>
            <p className="font-medium">PAL configurado com sucesso!</p>
            <p className="text-sm text-muted-foreground">
              O badge no header mostrará o status da conexão em tempo real.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
