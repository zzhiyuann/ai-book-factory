import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import YAML from "yaml";
import chalk from "chalk";
import { log } from "../utils/logger.js";
import { BACKLOG_PATH } from "../utils/constants.js";

export interface TopicEntry {
  id: number;
  title: string;
  description: string;
  tier: number;
  status: "pending" | "completed" | "skipped";
  source: "ai" | "user" | "serendipity";
  created: string;
  completed?: string;
}

interface Backlog {
  topics: TopicEntry[];
  next_id: number;
}

function loadBacklog(): Backlog {
  if (!existsSync(BACKLOG_PATH)) {
    return { topics: [], next_id: 1 };
  }
  const raw = readFileSync(BACKLOG_PATH, "utf-8");
  return YAML.parse(raw) || { topics: [], next_id: 1 };
}

function saveBacklog(backlog: Backlog): void {
  mkdirSync(dirname(BACKLOG_PATH), { recursive: true });
  writeFileSync(BACKLOG_PATH, YAML.stringify(backlog), "utf-8");
}

export async function runTopicsList(): Promise<void> {
  const backlog = loadBacklog();
  const pending = backlog.topics.filter((t) => t.status === "pending");
  const completed = backlog.topics.filter((t) => t.status === "completed");

  if (backlog.topics.length === 0) {
    log.info("No topics in backlog. Add some:");
    console.log(`  ${chalk.cyan('bookfactory topics add "Topic Name"')}`);
    console.log(`  ${chalk.cyan("bookfactory topics recommend")}`);
    return;
  }

  console.log(chalk.bold("\n📋 Topic Backlog\n"));

  if (pending.length > 0) {
    console.log(chalk.bold("Pending:"));
    for (const t of pending) {
      console.log(`  [${t.id}] ${chalk.yellow("○")} ${t.title} ${chalk.gray(`(tier ${t.tier}, ${t.source})`)}`);
      if (t.description) console.log(`      ${chalk.gray(t.description)}`);
    }
  }

  if (completed.length > 0) {
    console.log(chalk.bold("\nCompleted:"));
    for (const t of completed.slice(-10)) {
      console.log(`  [${t.id}] ${chalk.green("✓")} ${t.title} ${chalk.gray(t.completed || "")}`);
    }
    if (completed.length > 10) {
      console.log(chalk.gray(`  ... and ${completed.length - 10} more`));
    }
  }

  console.log(chalk.gray(`\n${pending.length} pending, ${completed.length} completed\n`));
}

export async function runTopicsAdd(
  title: string,
  options: { tier?: string; description?: string }
): Promise<void> {
  const backlog = loadBacklog();
  const entry: TopicEntry = {
    id: backlog.next_id++,
    title,
    description: options.description || "",
    tier: parseInt(options.tier || "2", 10),
    status: "pending",
    source: "user",
    created: new Date().toISOString().split("T")[0],
  };
  backlog.topics.push(entry);
  saveBacklog(backlog);
  log.success(`Added topic: "${title}" (tier ${entry.tier})`);
}

export async function runTopicsRemove(id: string): Promise<void> {
  const backlog = loadBacklog();
  const idx = backlog.topics.findIndex((t) => t.id === parseInt(id, 10));
  if (idx === -1) {
    log.error(`Topic #${id} not found.`);
    return;
  }
  const removed = backlog.topics.splice(idx, 1)[0];
  saveBacklog(backlog);
  log.success(`Removed topic: "${removed.title}"`);
}

export async function runTopicsRecommend(): Promise<void> {
  log.info("Topic recommendations require the AI recommender (Phase 2).");
  log.info("For now, add topics manually:");
  console.log(`  ${chalk.cyan('bookfactory topics add "Topic Name" --tier 1')}`);
}

export function getNextTopic(): TopicEntry | null {
  const backlog = loadBacklog();
  const pending = backlog.topics.filter((t) => t.status === "pending");
  if (pending.length === 0) return null;

  // Sort by tier (lower = higher priority), then by id
  pending.sort((a, b) => a.tier - b.tier || a.id - b.id);
  return pending[0];
}

export function markTopicCompleted(id: number): void {
  const backlog = loadBacklog();
  const topic = backlog.topics.find((t) => t.id === id);
  if (topic) {
    topic.status = "completed";
    topic.completed = new Date().toISOString().split("T")[0];
    saveBacklog(backlog);
  }
}
