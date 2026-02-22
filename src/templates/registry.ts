import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { TEMPLATES_DIR } from "../utils/constants.js";
import type { BookTemplate } from "./types.js";
import { deepDiveTemplate } from "./builtin/deep-dive.js";
import { comprehensiveTemplate } from "./builtin/comprehensive.js";
import { quickReadTemplate } from "./builtin/quick-read.js";
import { practicalGuideTemplate } from "./builtin/practical-guide.js";

const builtinTemplates: Map<string, BookTemplate> = new Map([
  ["deep-dive", deepDiveTemplate],
  ["comprehensive", comprehensiveTemplate],
  ["quick-read", quickReadTemplate],
  ["practical-guide", practicalGuideTemplate],
]);

export function getTemplate(name: string): BookTemplate | undefined {
  // Check builtins first
  if (builtinTemplates.has(name)) return builtinTemplates.get(name)!;

  // Check user templates dir
  const yamlPath = join(TEMPLATES_DIR, `${name}.yaml`);
  if (existsSync(yamlPath)) {
    const raw = readFileSync(yamlPath, "utf-8");
    return YAML.parse(raw) as BookTemplate;
  }

  return undefined;
}

export function listTemplates(): BookTemplate[] {
  const templates = [...builtinTemplates.values()];

  // Load user custom templates
  if (existsSync(TEMPLATES_DIR)) {
    const files = readdirSync(TEMPLATES_DIR).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml")
    );
    for (const file of files) {
      try {
        const raw = readFileSync(join(TEMPLATES_DIR, file), "utf-8");
        const t = YAML.parse(raw) as BookTemplate;
        if (t.name && !builtinTemplates.has(t.name)) {
          templates.push(t);
        }
      } catch {
        // skip invalid templates
      }
    }
  }

  return templates;
}

export function getTemplateNames(): string[] {
  return listTemplates().map((t) => t.name);
}
