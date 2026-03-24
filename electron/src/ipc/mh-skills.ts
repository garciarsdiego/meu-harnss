import { ipcMain } from "electron";
import { listSkills, saveSkill, deleteSkill, interpolateVariables } from "../lib/mh-skills-store";
import { Skill } from "../../../shared/types/pal";

export function registerMhSkillsHandlers(): void {
  ipcMain.handle("mh:skills:list", async (): Promise<Skill[]> => {
    return await listSkills();
  });

  ipcMain.handle("mh:skills:save", async (_event, data: Omit<Skill, "id" | "createdAt" | "updatedAt" | "schemaVersion"> & { id?: string }): Promise<Skill> => {
    return await saveSkill(data);
  });

  ipcMain.handle("mh:skills:delete", async (_event, id: string): Promise<void> => {
    await deleteSkill(id);
  });

  ipcMain.handle("mh:skills:apply", async (_event, { skillId, variables }: { skillId: string; variables: Record<string, string> }): Promise<string> => {
    const skills = await listSkills();
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) throw new Error(`Skill with ID ${skillId} not found.`);
    return interpolateVariables(skill.template, variables);
  });
}
