import { useState, useEffect, useCallback } from "react";
import { Skill } from "../../../../../shared/types/pal";

interface UseSkillsResult {
  skills: Skill[];
  builtins: Skill[];
  loading: boolean;
  save: (data: Omit<Skill, "id" | "createdAt" | "updatedAt" | "schemaVersion"> & { id?: string }) => Promise<Skill>;
  remove: (id: string) => Promise<void>;
  apply: (skillId: string, variables: Record<string, string>) => Promise<string>;
}

export function useSkills(): UseSkillsResult {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      // @ts-expect-error - ipcRenderer injected via preload
      const data: Skill[] = await window.ipcRenderer.invoke("mh:skills:list");
      setSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const save = async (data: Omit<Skill, "id" | "createdAt" | "updatedAt" | "schemaVersion"> & { id?: string }): Promise<Skill> => {
    // @ts-expect-error
    const result: Skill = await window.ipcRenderer.invoke("mh:skills:save", data);
    await fetchSkills();
    return result;
  };

  const remove = async (id: string): Promise<void> => {
    // @ts-expect-error
    await window.ipcRenderer.invoke("mh:skills:delete", id);
    await fetchSkills();
  };

  const apply = async (skillId: string, variables: Record<string, string>): Promise<string> => {
    // @ts-expect-error
    return (await window.ipcRenderer.invoke("mh:skills:apply", { skillId, variables })) as string;
  };

  const builtins = skills.filter((s) => s.isBuiltin);

  return { skills, builtins, loading, save, remove, apply };
}
