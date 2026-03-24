// MeuHarnss 2.0 — CRUD genérico com escrita atômica
// Escrita atômica: write-to-tmp → rename (safe no Windows no mesmo volume)

import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";

export function generateId(prefix = ""): string {
  const hash = createHash("sha1")
    .update(Date.now().toString() + Math.random().toString())
    .digest("hex")
    .slice(0, 12);
  return prefix ? `${prefix}_${hash}` : hash;
}

export const writeJson = writeJsonAtomic;

export async function writeJsonAtomic(
  filePath: string,
  data: unknown
): Promise<void> {
  const tmp = filePath + ".tmp";
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(tmp, json, "utf-8");
  try {
    await fs.rename(tmp, filePath);
  } catch (err) {
    // Windows: rename falha se destino existe em alguns casos
    await fs.copyFile(tmp, filePath);
    await fs.unlink(tmp).catch(() => undefined);
  }
}

export async function readJson<T>(
  filePath: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function listJsonDir<T>(dir: string): Promise<T[]> {
  try {
    const files = await fs.readdir(dir);
    const results: T[] = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file.endsWith(".bak.json")) continue;
      const item = await readJson<T | null>(path.join(dir, file), null);
      if (item !== null) results.push(item);
    }
    return results;
  } catch {
    return [];
  }
}

export async function deleteJsonFile(filePath: string): Promise<void> {
  // Mantém backup antes de deletar
  const bak = filePath.replace(".json", ".bak.json");
  await fs.copyFile(filePath, bak).catch(() => undefined);
  await fs.unlink(filePath);
}
