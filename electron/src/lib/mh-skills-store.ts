import { Skill } from "../../../shared/types/pal";
import { BUILTIN_SKILLS } from "./mh-builtin-skills";
import { getMhExtensionsDir } from "./mh-data-dir";
import { readJson, writeJsonAtomic, deleteJsonFile, generateId, listJsonDir } from "./mh-json-store";
import path from "path";

const skillsCache = new Map<string, Skill>();

// Loads builtins on init
BUILTIN_SKILLS.forEach((skill) => {
  skillsCache.set(skill.id, skill);
});

export async function listSkills(): Promise<Skill[]> {
  const dir = getMhExtensionsDir("skills");
  const userSkills = await listJsonDir<Skill>(dir);
  
  const allSkills = new Map<string, Skill>();
  
  BUILTIN_SKILLS.forEach((skill) => allSkills.set(skill.id, skill));
  
  userSkills.forEach((skill) => {
    if (!skill.isBuiltin) {
      allSkills.set(skill.id, skill);
      skillsCache.set(skill.id, skill);
    }
  });

  return Array.from(allSkills.values());
}

export async function saveSkill(
  data: Omit<Skill, "id" | "createdAt" | "updatedAt" | "schemaVersion"> & { id?: string }
): Promise<Skill> {
  const isUpdating = !!data.id;
  const id = data.id || generateId("skill");

  if (id.startsWith("builtin_") || data.isBuiltin) {
    throw new Error("Cannot modify built-in skills.");
  }

  const existing = skillsCache.get(id);
  const now = Date.now();

  const skill: Skill = {
    ...data,
    id,
    schemaVersion: existing?.schemaVersion || 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    isBuiltin: false,
  };

  const filePath = path.join(getMhExtensionsDir("skills"), `${id}.json`);
  await writeJsonAtomic(filePath, skill);
  skillsCache.set(id, skill);

  return skill;
}

export async function deleteSkill(id: string): Promise<void> {
  if (id.startsWith("builtin_") || skillsCache.get(id)?.isBuiltin) {
    throw new Error("Cannot delete built-in skills.");
  }
  
  const filePath = path.join(getMhExtensionsDir("skills"), `${id}.json`);
  await deleteJsonFile(filePath);
  skillsCache.delete(id);
}

export function interpolateVariables(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
    return values[varName] !== undefined ? values[varName] : match;
  });
}
