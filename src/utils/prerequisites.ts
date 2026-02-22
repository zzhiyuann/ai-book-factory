import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { log } from "./logger.js";

export interface PrerequisiteResult {
  name: string;
  found: boolean;
  required: boolean;
  version?: string;
  path?: string;
}

function checkCommand(cmd: string): { found: boolean; version?: string } {
  try {
    const out = execSync(`${cmd} --version 2>/dev/null || ${cmd} -v 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    return { found: true, version: out.split("\n")[0] };
  } catch {
    return { found: false };
  }
}

function checkChrome(): { found: boolean; path?: string } {
  const paths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of paths) {
    if (existsSync(p)) return { found: true, path: p };
  }
  return { found: false };
}

export function checkPrerequisites(): PrerequisiteResult[] {
  const results: PrerequisiteResult[] = [];

  // Claude CLI (required)
  const claude = checkCommand("claude");
  results.push({
    name: "Claude CLI",
    found: claude.found,
    required: true,
    version: claude.version,
  });

  // Node.js (required — already running if we're here)
  results.push({
    name: "Node.js",
    found: true,
    required: true,
    version: process.version,
  });

  // pandoc (optional, for high-quality MD→HTML)
  const pandoc = checkCommand("pandoc");
  results.push({
    name: "pandoc",
    found: pandoc.found,
    required: false,
    version: pandoc.version,
  });

  // Chrome/Chromium (optional, for PDF)
  const chrome = checkChrome();
  results.push({
    name: "Chrome/Chromium",
    found: chrome.found,
    required: false,
    path: chrome.path,
  });

  return results;
}

export function printPrerequisites(results: PrerequisiteResult[]): boolean {
  let allRequired = true;

  for (const r of results) {
    const status = r.found ? "✓" : r.required ? "✗" : "○";
    const color = r.found ? "green" : r.required ? "red" : "yellow";
    const extra = r.version ? ` (${r.version})` : r.path ? ` (${r.path})` : "";
    const label = r.required ? "" : " (optional)";

    if (color === "green") log.success(`${r.name}${extra}`);
    else if (color === "red") {
      log.error(`${r.name} — REQUIRED but not found`);
      allRequired = false;
    } else {
      log.warn(`${r.name}${label} — not found, some features disabled`);
    }
  }

  return allRequired;
}
