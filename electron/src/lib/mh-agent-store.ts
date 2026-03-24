import path from "path";
import type { AgentConfig } from "../../../shared/types/pal";
import { getMhExtensionsDir } from "./mh-data-dir";
import {
  deleteJsonFile,
  generateId,
  listJsonDir,
  readJson,
  writeJsonAtomic,
} from "./mh-json-store";

type SaveAgentInput = Omit<
  AgentConfig,
  "id" | "createdAt" | "updatedAt" | "schemaVersion"
> & { id?: string };

const AGENT_SCHEMA_VERSION = 1;
const agentCache = new Map<string, AgentConfig>();
let cacheHydrated = false;

function getAgentsDir(): string {
  return getMhExtensionsDir("agents");
}

function getAgentFilePath(id: string): string {
  return path.join(getAgentsDir(), `${id}.json`);
}

function sortAgents(agents: AgentConfig[]): AgentConfig[] {
  return agents.sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.createdAt - right.createdAt,
  );
}

async function hydrateCache(): Promise<void> {
  if (cacheHydrated) {
    return;
  }

  const agents = await listJsonDir<AgentConfig>(getAgentsDir());
  agentCache.clear();

  for (const agent of agents) {
    agentCache.set(agent.id, agent);
  }

  cacheHydrated = true;
}

export async function listAgents(): Promise<AgentConfig[]> {
  await hydrateCache();
  return sortAgents([...agentCache.values()]);
}

export async function saveAgent(data: SaveAgentInput): Promise<AgentConfig> {
  await hydrateCache();

  const existing = data.id
    ? agentCache.get(data.id) ??
      (await readJson<AgentConfig | null>(getAgentFilePath(data.id), null))
    : undefined;
  const existingAgent = existing ?? {};

  const now = Date.now();
  const id = data.id ?? generateId("agent");
  const nextAgent: AgentConfig = {
    ...existingAgent,
    ...data,
    id,
    schemaVersion: AGENT_SCHEMA_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await writeJsonAtomic(getAgentFilePath(id), nextAgent);
  agentCache.set(id, nextAgent);
  cacheHydrated = true;

  return nextAgent;
}

export async function deleteAgent(id: string): Promise<void> {
  await hydrateCache();

  const filePath = getAgentFilePath(id);
  const existing =
    agentCache.get(id) ?? (await readJson<AgentConfig | null>(filePath, null));

  if (!existing) {
    agentCache.delete(id);
    return;
  }

  await deleteJsonFile(filePath);
  agentCache.delete(id);
  cacheHydrated = true;
}

export async function getAgent(id: string): Promise<AgentConfig | undefined> {
  await hydrateCache();
  return agentCache.get(id);
}
