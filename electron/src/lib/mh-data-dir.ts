// MeuHarnss 2.0 — diretório de dados isolado
// Usa userData do Electron para ser compatível com Windows/macOS/Linux
// NUNCA usa ~/ direto — app.getPath('userData') é o caminho correto

import { app } from "electron";
import path from "path";
import fs from "fs";

export function getMhDataDir(): string {
  const dir = path.join(app.getPath("userData"), "meu-harnss");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getMhExtensionsDir(
  subdir: "agents" | "teams" | "skills"
): string {
  const dir = path.join(getMhDataDir(), "extensions", subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getMhDbPath(): string {
  return path.join(getMhDataDir(), "meu-harnss.db");
}

export function getMhPalConfigPath(): string {
  return path.join(getMhDataDir(), "pal-config.json");
}
