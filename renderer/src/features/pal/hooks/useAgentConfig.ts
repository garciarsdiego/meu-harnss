import { useEffect, useState } from "react";
import type { AgentConfig } from "../../../../../shared/types/pal";

type AgentConfigBaseInput = Omit<
  AgentConfig,
  "id" | "createdAt" | "updatedAt" | "schemaVersion"
>;

type AgentConfigSaveInput =
  | AgentConfig
  | (AgentConfigBaseInput & { id?: string });

interface MhWindowIpc {
  invoke(channel: "mh:agent-config:list"): Promise<AgentConfig[]>;
  invoke(
    channel: "mh:agent-config:save",
    data: AgentConfigSaveInput,
  ): Promise<AgentConfig>;
  invoke(channel: "mh:agent-config:delete", id: string): Promise<void>;
}

declare global {
  interface Window {
    ipc: MhWindowIpc;
  }
}

const SELECTED_AGENT_STORAGE_KEY = "mh:selected-agent";

function sortAgents(agents: AgentConfig[]): AgentConfig[] {
  return [...agents].sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.createdAt - right.createdAt,
  );
}

function readSelectedAgentId(): string | null {
  const storedId = localStorage.getItem(SELECTED_AGENT_STORAGE_KEY);
  return storedId && storedId.trim().length > 0 ? storedId : null;
}

function persistSelectedAgentId(id: string | null): void {
  if (id) {
    localStorage.setItem(SELECTED_AGENT_STORAGE_KEY, id);
    return;
  }

  localStorage.removeItem(SELECTED_AGENT_STORAGE_KEY);
}

export function useAgentConfig() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(readSelectedAgentId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void window.ipc
      .invoke("mh:agent-config:list")
      .then((loadedAgents) => {
        if (!cancelled) {
          setAgents(sortAgents(loadedAgents));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAgents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistSelectedAgentId(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId && !agents.some((agent) => agent.id === selectedId)) {
      setSelectedId(null);
    }
  }, [agents, selectedId]);

  const selected = agents.find((agent) => agent.id === selectedId) ?? null;

  async function save(data: AgentConfigSaveInput): Promise<AgentConfig> {
    setLoading(true);

    try {
      const savedAgent = await window.ipc.invoke("mh:agent-config:save", data);
      setAgents((currentAgents) => {
        const nextAgents = currentAgents.filter(
          (agent) => agent.id !== savedAgent.id,
        );
        nextAgents.push(savedAgent);
        return sortAgents(nextAgents);
      });
      setSelectedId(savedAgent.id);
      return savedAgent;
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setLoading(true);

    try {
      await window.ipc.invoke("mh:agent-config:delete", id);
      setAgents((currentAgents) =>
        currentAgents.filter((agent) => agent.id !== id),
      );

      if (selectedId === id) {
        setSelectedId(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function select(id: string | null): void {
    setSelectedId(id);
  }

  return {
    agents,
    loading,
    save,
    remove,
    selected,
    select,
  };
}
