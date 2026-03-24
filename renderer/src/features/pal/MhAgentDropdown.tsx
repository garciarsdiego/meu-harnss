import { useAgentConfig } from "./hooks/useAgentConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../src/components/ui/dropdown-menu";
import { Badge } from "../../../../src/components/ui/badge";
import { Bot, ChevronDown } from "lucide-react";
import type { AgentConfig } from "../../../../shared/types/pal";

const BTN = "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

const TYPE_LABELS: Record<AgentConfig["agentType"], string> = {
  claude: "Claude",
  codex: "Codex",
  acp: "ACP",
  pal: "PAL",
};

export function MhAgentDropdown() {
  const { agents, selected, select } = useAgentConfig();

  // Don't render if no agents configured
  if (agents.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={BTN} title="Agente PAL ativo">
          <Bot className="h-3 w-3" />
          {selected ? selected.name : "Agente"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {agents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => select(agent.id)}
            className={agent.id === selected?.id ? "bg-accent" : ""}
          >
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <span>{agent.name}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {TYPE_LABELS[agent.agentType]}
                </Badge>
              </div>
              {agent.systemPrompt && (
                <span className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {agent.systemPrompt}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        {selected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => select(null)}>
              <span className="text-muted-foreground">Nenhum agente</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
