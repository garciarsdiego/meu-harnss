// MeuHarnss 2.0 — shared/types/pal.ts
// Tipos exclusivos do MeuHarnss. Nunca modificar tipos do Harnss core.

export type AgentType = "claude" | "codex" | "acp" | "pal";
export type OrchestrationMode = "sequential" | "parallel" | "dag";
export type PalTool =
  | "chat"
  | "thinkdeep"
  | "planner"
  | "consensus"
  | "codereview"
  | "debug"
  | "challenge";
export type PermissionMode = "default" | "acceptEdits" | "bypassPermissions";

export interface AgentConfig {
  id: string;
  name: string;
  agentType: AgentType;
  systemPrompt?: string;
  preferredModel?: string;
  toolSubset?: string[];
  permissionMode?: PermissionMode;
  persona?: string;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

export interface SkillVariable {
  name: string;
  type: "string" | "number" | "boolean" | "file_path";
  required: boolean;
  default?: string | number | boolean;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string; // suporta {{variavel}} interpolation
  variables: SkillVariable[];
  builtinPalTool?: PalTool;
  isBuiltin: boolean;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

export interface AgentTeam {
  id: string;
  name: string;
  description?: string;
  agents: AgentConfig[];
  orchestrationMode: OrchestrationMode;
  palConversationId?: string;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

export interface PalConfig {
  litellmProxyUrl: string; // ex: http://localhost:4000
  defaultModel: string; // ex: auto
  isConfigured: boolean;
  lastTestedAt?: number;
}

export interface PalConnectionResult {
  ok: boolean;
  latencyMs?: number;
  models?: string[];
  error?: string;
}

export interface TeamRunStep {
  agentId: string;
  sessionId: string;
  startedAt: number;
  completedAt?: number;
  palConversationId?: string;
}

export interface TeamRun {
  id: string;
  teamId: string;
  steps: TeamRunStep[];
  palConversationId?: string;
  startedAt: number;
  completedAt?: number;
}

// IPC channels — todos prefixados com "mh:" para nunca colidir com upstream Harnss
export type MhIpcChannel =
  | "mh:agent-config:list"
  | "mh:agent-config:save"
  | "mh:agent-config:delete"
  | "mh:skills:list"
  | "mh:skills:save"
  | "mh:skills:delete"
  | "mh:skills:apply"
  | "mh:teams:list"
  | "mh:teams:save"
  | "mh:teams:delete"
  | "mh:teams:run"
  | "mh:teams:status"
  | "mh:pal:detect"
  | "mh:pal:test-connection"
  | "mh:pal:save-config"
  | "mh:pal:get-config";
