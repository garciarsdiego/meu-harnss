import { ipcMain } from "electron";
import type { AgentConfig } from "../../../shared/types/pal";
import { deleteAgent, listAgents, saveAgent } from "../lib/mh-agent-store";

type AgentConfigSaveInput =
  | AgentConfig
  | (Omit<
      AgentConfig,
      "id" | "createdAt" | "updatedAt" | "schemaVersion"
    > & { id?: string });

type StoreSaveInput = Omit<
  AgentConfig,
  "id" | "createdAt" | "updatedAt" | "schemaVersion"
> & { id?: string };

function toStoreSaveInput(data: AgentConfigSaveInput): StoreSaveInput {
  return {
    id: data.id,
    name: data.name,
    agentType: data.agentType,
    systemPrompt: data.systemPrompt,
    preferredModel: data.preferredModel,
    toolSubset: data.toolSubset,
    permissionMode: data.permissionMode,
    persona: data.persona,
  };
}

export function registerMhAgentConfigHandlers(): void {
  ipcMain.handle("mh:agent-config:list", async (): Promise<AgentConfig[]> => {
    return listAgents();
  });

  ipcMain.handle(
    "mh:agent-config:save",
    async (
      _event,
      data: AgentConfigSaveInput,
    ): Promise<AgentConfig> => {
      return saveAgent(toStoreSaveInput(data));
    },
  );

  ipcMain.handle(
    "mh:agent-config:delete",
    async (_event, id: string): Promise<void> => {
      await deleteAgent(id);
    },
  );
}
