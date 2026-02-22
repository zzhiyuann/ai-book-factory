import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import YAML from "yaml";
import {
  CONFIG_DIR,
  DATA_DIR,
  CONFIG_PATH,
  PROFILE_PATH,
  BOOKS_DIR,
  LOGS_DIR,
  TEMPLATES_DIR,
} from "../utils/constants.js";
import { type UserProfile, defaultProfile } from "./schema.js";
import { type AppConfig, defaultConfig } from "./config-schema.js";

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function ensureDirectories(): void {
  ensureDir(CONFIG_DIR);
  ensureDir(DATA_DIR);
  ensureDir(BOOKS_DIR);
  ensureDir(LOGS_DIR);
  ensureDir(TEMPLATES_DIR);
}

export function loadProfile(): UserProfile {
  if (!existsSync(PROFILE_PATH)) return defaultProfile();
  const raw = readFileSync(PROFILE_PATH, "utf-8");
  const parsed = YAML.parse(raw);
  return { ...defaultProfile(), ...parsed };
}

export function saveProfile(profile: UserProfile): void {
  ensureDir(dirname(PROFILE_PATH));
  const content = YAML.stringify(profile, { lineWidth: 120 });
  writeFileSync(PROFILE_PATH, content, "utf-8");
}

export function loadConfig(): AppConfig {
  if (!existsSync(CONFIG_PATH)) return defaultConfig();
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = YAML.parse(raw);
  return deepMerge(defaultConfig(), parsed) as AppConfig;
}

export function saveConfig(config: AppConfig): void {
  ensureDir(dirname(CONFIG_PATH));
  const content = YAML.stringify(config, { lineWidth: 120 });
  writeFileSync(CONFIG_PATH, content, "utf-8");
}

export function isInitialized(): boolean {
  return existsSync(PROFILE_PATH) && existsSync(CONFIG_PATH);
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
