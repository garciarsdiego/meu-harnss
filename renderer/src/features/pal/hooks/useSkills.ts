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
      const data: Skill[] = await window.ipc.invoke<Skill[]>("mh:skills:list");
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
    const result: Skill = await window.ipc.invoke<Skill>("mh:skills:save", data);
    await fetchSkills();
    return result;
  };

  const remove = async (id: string): Promise<void> => {
    await window.ipc.invoke("mh:skills:delete", id);
    await fetchSkills();
  };

  const apply = async (skillId: string, variables: Record<string, string>): Promise<string> => {
    return await window.ipc.invoke<string>("mh:skills:apply", { skillId, variables });
  };

  const builtins = skills.filter((s) => s.isBuiltin);

  return { skills, builtins, loading, save, remove, apply };
}
