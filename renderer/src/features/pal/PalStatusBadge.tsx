import { usePalStatus } from "./hooks/usePalStatus";
import { PalSetupWizard } from "./PalSetupWizard";

export function PalStatusBadge() {
  const { status, latencyMs, isWizardOpen, openWizard, closeWizard } =
    usePalStatus();

  const colors: Record<typeof status, string> = {
    online: "bg-green-500",
    offline: "bg-yellow-500",
    unconfigured: "bg-neutral-400",
  };

  const labels: Record<typeof status, string> = {
    online: latencyMs !== null ? `PAL · ${latencyMs}ms` : "PAL Online",
    offline: "PAL Offline",
    unconfigured: "PAL Setup",
  };

  const tooltips: Record<typeof status, string> = {
    online: "PAL conectado e funcionando",
    offline: "PAL configurado mas inacessível — clique para verificar",
    unconfigured: "Configure o PAL para usar orquestração multi-modelo",
  };

  return (
    <>
      <button
        onClick={openWizard}
        title={tooltips[status]}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/10"
      >
        <span className={`h-2 w-2 rounded-full ${colors[status]}`} />
        <span className="text-foreground/70">{labels[status]}</span>
      </button>
      <PalSetupWizard open={isWizardOpen} onClose={closeWizard} />
    </>
  );
}
