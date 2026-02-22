#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load version from package.json
let version = "0.1.0";
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
  version = pkg.version;
} catch {
  // ignore
}

const program = new Command();

program
  .name("bookfactory")
  .description("AI-powered personalized book generation via Claude CLI")
  .version(version);

// ── init ──
program
  .command("init")
  .description("Set up your profile and configuration")
  .option("-f, --force", "Overwrite existing configuration")
  .action(async (options) => {
    const { runInit } = await import("../src/cli/init.js");
    await runInit(options);
  });

// ── generate ──
program
  .command("generate [topic]")
  .description("Generate a personalized book on a topic")
  .option("-t, --template <name>", "Book template (deep-dive, comprehensive, quick-read, practical-guide)")
  .option("-d, --dry-run", "Print the assembled prompt without generating")
  .option("-n, --non-interactive", "Run without interactive output (for automation)")
  .option("-o, --output <dir>", "Custom output directory")
  .option("--max-turns <n>", "Maximum Claude CLI turns", parseInt)
  .action(async (topic, options) => {
    const { runGenerate } = await import("../src/cli/generate.js");
    await runGenerate(topic, options);
  });

// ── topics ──
const topics = program
  .command("topics")
  .description("Manage your topic backlog");

topics
  .command("list")
  .description("Show all topics in the backlog")
  .action(async () => {
    const { runTopicsList } = await import("../src/cli/topics.js");
    await runTopicsList();
  });

topics
  .command("add <title>")
  .description("Add a topic to the backlog")
  .option("--tier <n>", "Priority tier (1=highest)", "2")
  .option("--description <text>", "Topic description")
  .action(async (title, options) => {
    const { runTopicsAdd } = await import("../src/cli/topics.js");
    await runTopicsAdd(title, options);
  });

topics
  .command("remove <id>")
  .description("Remove a topic from the backlog")
  .action(async (id) => {
    const { runTopicsRemove } = await import("../src/cli/topics.js");
    await runTopicsRemove(id);
  });

topics
  .command("recommend")
  .description("Get AI-powered topic recommendations")
  .action(async () => {
    const { runTopicsRecommend } = await import("../src/cli/topics.js");
    await runTopicsRecommend();
  });

// ── config ──
program
  .command("config")
  .description("Show current configuration")
  .action(async () => {
    const { runConfigShow } = await import("../src/cli/config-cmd.js");
    await runConfigShow();
  });

// ── history ──
program
  .command("history")
  .description("Show generation history")
  .action(async () => {
    const { runHistory } = await import("../src/cli/history.js");
    await runHistory();
  });

// ── deliver ──
program
  .command("deliver <file>")
  .description("Deliver a generated book via a channel")
  .option("--via <channel>", "Delivery channel (email, telegram)", "local")
  .option("--title <title>", "Book title for the delivery")
  .action(async (file, options) => {
    const { resolve } = await import("node:path");
    const { existsSync } = await import("node:fs");
    const { getDeliveryPlugin } = await import("../src/delivery/registry.js");
    const { log } = await import("../src/utils/logger.js");

    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      log.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const plugin = getDeliveryPlugin(options.via);
    if (!plugin) {
      log.error(`Unknown delivery channel: ${options.via}`);
      process.exit(1);
    }

    if (!plugin.isConfigured()) {
      log.error(`${options.via} is not configured. Edit ~/.config/bookfactory/config.yaml`);
      process.exit(1);
    }

    const title = options.title || file.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
    await plugin.deliver({ filePath, title });
  });

// ── schedule ──
program
  .command("schedule")
  .description("Set up automated book generation (Phase 3)")
  .action(async () => {
    const { log } = await import("../src/utils/logger.js");
    log.info("Schedule system will be available in Phase 3.");
    log.info("For now, use cron or launchd manually:");
    console.log("  bookfactory generate --non-interactive");
  });

program.parse();
