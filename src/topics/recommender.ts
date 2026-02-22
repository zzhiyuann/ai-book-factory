import { execSync } from "node:child_process";
import chalk from "chalk";
import YAML from "yaml";
import { log } from "../utils/logger.js";
import { loadProfile } from "../profile/manager.js";
import { getCoveredConcepts, getCompletedTopics } from "./knowledge-graph.js";
import type { TopicEntry } from "../cli/topics.js";

export interface Recommendation {
  title: string;
  description: string;
  why_for_you: string;
  category: "primary" | "adjacent" | "serendipity";
  connects_to: string[];
}

function buildRecommenderPrompt(): string {
  const profile = loadProfile();
  const covered = getCoveredConcepts();
  const completed = getCompletedTopics();

  let prompt = `You are a personalized learning advisor. Generate exactly 10 book topic recommendations as YAML.

## Reader Profile
- Name: ${profile.name}
- Role: ${profile.role}
- Organization: ${profile.organization}
- Primary Interests: ${profile.interests.primary.join(", ")}
- Secondary Interests: ${profile.interests.secondary.join(", ")}
- Curiosity Areas: ${profile.interests.curiosity.join(", ")}
- Learning Style: ${profile.goals.style}
- Goals: ${profile.goals.description}
`;

  if (profile.open_profile) {
    prompt += `\n## About the Reader\n${profile.open_profile}\n`;
  }

  if (completed.length > 0) {
    prompt += `\n## Already Covered (DO NOT repeat these)\n${completed.join(", ")}\n`;
  }

  if (covered.length > 0) {
    prompt += `\n## Known Concepts (can reference, don't re-teach basics)\n${covered.slice(0, 30).join(", ")}\n`;
  }

  prompt += `
## Requirements
Generate 10 recommendations with this category mix:
- 6 from primary interests (deep, specific — not generic)
- 2 adjacent/connecting (bridge between their interests)
- 2 serendipity (surprising, outside comfort zone, but justified)

Output ONLY valid YAML, no other text. Format:
\`\`\`yaml
recommendations:
  - title: "Specific Topic Title"
    description: "2-sentence description"
    why_for_you: "Why this matters for this specific reader"
    category: primary  # or adjacent, serendipity
    connects_to:
      - "concept1"
      - "concept2"
\`\`\`

Be SPECIFIC. Not "Machine Learning" but "Gradient-Free Optimization for Black-Box Models". Not "Leadership" but "Technical Influence Without Authority in Matrix Organizations".`;

  return prompt;
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const prompt = buildRecommenderPrompt();

  log.info("Asking Claude for personalized topic recommendations...");

  try {
    const output = execSync(
      `claude -p ${JSON.stringify(prompt)} --max-turns 3`,
      {
        encoding: "utf-8",
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    // Extract YAML from output
    const yamlMatch = output.match(/```ya?ml\n([\s\S]*?)```/) || output.match(/recommendations:\n([\s\S]*)/);
    let yamlStr = yamlMatch ? yamlMatch[0].replace(/```ya?ml\n?/, "").replace(/```/, "") : output;

    // Try to find the YAML block
    if (!yamlStr.includes("recommendations:")) {
      // Try the whole output
      yamlStr = output;
    }

    const parsed = YAML.parse(yamlStr);
    const recs: Recommendation[] = parsed?.recommendations || [];

    if (recs.length === 0) {
      log.warn("Could not parse recommendations. Raw output saved to log.");
      return [];
    }

    return recs;
  } catch (err) {
    log.error(`Recommendation failed: ${err}`);
    return [];
  }
}

export function printRecommendations(recs: Recommendation[]): void {
  if (recs.length === 0) {
    log.warn("No recommendations generated.");
    return;
  }

  console.log(chalk.bold("\n🎯 Personalized Topic Recommendations\n"));

  const categories = {
    primary: { label: "Core Interests", color: chalk.blue },
    adjacent: { label: "Connecting Topics", color: chalk.magenta },
    serendipity: { label: "Serendipity", color: chalk.yellow },
  };

  for (const [cat, { label, color }] of Object.entries(categories)) {
    const items = recs.filter((r) => r.category === cat);
    if (items.length === 0) continue;

    console.log(color.bold(`  ${label}:`));
    for (const r of items) {
      console.log(`    ${color("●")} ${chalk.bold(r.title)}`);
      console.log(`      ${chalk.gray(r.description)}`);
      console.log(`      ${chalk.italic.cyan(`Why: ${r.why_for_you}`)}`);
      if (r.connects_to?.length) {
        console.log(`      ${chalk.gray(`Connects to: ${r.connects_to.join(", ")}`)}`);
      }
      console.log();
    }
  }

  console.log(chalk.gray("  Add a topic: bookfactory topics add \"Topic Name\""));
  console.log(chalk.gray("  Generate now: bookfactory generate \"Topic Name\"\n"));
}
