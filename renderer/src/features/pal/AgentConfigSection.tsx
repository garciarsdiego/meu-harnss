import { useState } from "react";
import type { AgentConfig } from "../../../../shared/types/pal";
import { useAgentConfig } from "./hooks/useAgentConfig";
import { AgentConfigPanel } from "./AgentConfigPanel";
import { Button } from "../../../../src/components/ui/button";
import { Badge } from "../../../../src/components/ui/badge";
import { Plus, Pencil, Trash2, Bot } from "lucide-react";

const AGENT_TYPE_LABELS: Record<AgentConfig["agentType"], string> = {
  claude: "Claude",
  codex: "Codex",
  acp: "ACP",
  pal: "PAL",
};

export function AgentConfigSection() {
  const { agents, loading, remove } = useAgentConfig();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function openNew() {
    setEditingId(null);
    setPanelOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Custom Agents</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure agentes personalizados com prompts, modelos e permissões específicas.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Novo Agente
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          Carregando…
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Bot className="h-7 w-7 text-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Nenhum agente configurado. Crie o primeiro para personalizar o comportamento do assistente.
          </p>
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Criar Agente
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-start justify-between rounded-lg border border-border p-3.5"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{agent.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {AGENT_TYPE_LABELS[agent.agentType]}
                  </Badge>
                  {agent.permissionMode && agent.permissionMode !== "default" && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {agent.permissionMode}
                    </Badge>
                  )}
                </div>
                {agent.systemPrompt && (
                  <span className="text-xs text-muted-foreground truncate max-w-xs">
                    {agent.systemPrompt}
                  </span>
                )}
                {agent.preferredModel && (
                  <span className="text-xs text-muted-foreground/60 font-mono">
                    {agent.preferredModel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button
                  onClick={() => openEdit(agent.id)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void remove(agent.id)}
                  className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AgentConfigPanel
        open={panelOpen}
        agentId={editingId}
        onClose={handleClose}
        onSaved={handleClose}
      />
    </div>
  );
}
