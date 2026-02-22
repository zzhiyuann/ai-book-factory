import inquirer from "inquirer";
import chalk from "chalk";
import { log } from "../utils/logger.js";
import { checkPrerequisites, printPrerequisites } from "../utils/prerequisites.js";
import { defaultProfile } from "../profile/schema.js";
import { defaultConfig } from "../profile/config-schema.js";
import {
  saveProfile,
  saveConfig,
  ensureDirectories,
  isInitialized,
} from "../profile/manager.js";
import { BOOKS_DIR, CONFIG_DIR } from "../utils/constants.js";

export async function runInit(options: { force?: boolean }): Promise<void> {
  console.log();
  console.log(chalk.bold("📚 Welcome to AI Book Factory"));
  console.log(chalk.gray("Personalized book generation powered by Claude\n"));

  // Check if already initialized
  if (isInitialized() && !options.force) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "Already initialized. Overwrite existing config?",
        default: false,
      },
    ]);
    if (!overwrite) {
      log.info("Keeping existing configuration.");
      return;
    }
  }

  // Phase 1: Prerequisites
  console.log(chalk.bold("\n— Step 1: Prerequisites Check —\n"));
  const prereqs = checkPrerequisites();
  const allRequired = printPrerequisites(prereqs);

  if (!allRequired) {
    log.error("\nMissing required prerequisites. Install them and try again.");
    log.info("Install Claude CLI: npm install -g @anthropic-ai/claude-code");
    process.exit(1);
  }
  console.log();

  // Phase 2: Identity (30s)
  console.log(chalk.bold("— Step 2: Identity —\n"));
  const identity = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Your name:",
      validate: (v: string) => v.trim().length > 0 || "Name is required",
    },
    {
      type: "input",
      name: "role",
      message: "Your role (e.g., Software Engineer, Product Manager, Researcher):",
    },
    {
      type: "input",
      name: "organization",
      message: "Organization (optional):",
    },
    {
      type: "list",
      name: "language",
      message: "Book language:",
      choices: [
        { name: "English", value: "en" },
        { name: "中文 (Chinese)", value: "zh" },
        { name: "Español (Spanish)", value: "es" },
        { name: "Other (specify in config later)", value: "en" },
      ],
    },
  ]);

  // Phase 3: Interests & Goals (1min)
  console.log(chalk.bold("\n— Step 3: Interests & Goals —\n"));
  const interests = await inquirer.prompt([
    {
      type: "input",
      name: "primary",
      message: "Primary interests (comma-separated, e.g., machine learning, product design):",
      filter: (v: string) =>
        v
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
    },
    {
      type: "input",
      name: "secondary",
      message: "Secondary interests (comma-separated, optional):",
      filter: (v: string) =>
        v
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
    },
    {
      type: "input",
      name: "curiosity",
      message: "Curiosity areas — things you're curious about outside work (optional):",
      filter: (v: string) =>
        v
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
    },
    {
      type: "list",
      name: "style",
      message: "Learning style:",
      choices: [
        {
          name: "Deep Expertise — thorough, expert-level understanding of topics",
          value: "deep-expertise",
        },
        {
          name: "Broad Exploration — survey many topics and find connections",
          value: "broad-exploration",
        },
        {
          name: "Practical Skills — actionable, immediately applicable knowledge",
          value: "practical-skills",
        },
      ],
    },
    {
      type: "input",
      name: "goals_description",
      message: "Briefly, what are you trying to learn or achieve? (optional):",
    },
  ]);

  // Phase 4: Open Profile (0-5min)
  console.log(chalk.bold("\n— Step 4: Open Profile —\n"));
  console.log(
    chalk.gray(
      "This is the most powerful part. Tell the AI about yourself — your background,\n" +
        "what you're working on, your thinking style, challenges you face, what kind of\n" +
        "books would be most useful. Write as much or as little as you want.\n" +
        "This text is injected verbatim into every book generation prompt.\n"
    )
  );
  console.log(chalk.gray("(Press Enter twice or type 'done' on a new line to finish)\n"));

  const { open_profile } = await inquirer.prompt([
    {
      type: "editor",
      name: "open_profile",
      message: "Open your editor to write your profile (save and close to continue):",
      default:
        "# About Me\n\n(Write about yourself here — background, goals, challenges, thinking style...)\n",
    },
  ]);

  // Phase 5: Preferences (30s)
  console.log(chalk.bold("\n— Step 5: Book Preferences —\n"));
  const prefs = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "Default book template:",
      choices: [
        { name: "Comprehensive (8-12K words, balanced depth) — Recommended", value: "comprehensive" },
        { name: "Deep Dive (15K+ words, maximum depth)", value: "deep-dive" },
        { name: "Quick Read (3-5K words, essentials only)", value: "quick-read" },
        { name: "Practical Guide (10-15K words, heavy on how-to)", value: "practical-guide" },
      ],
    },
    {
      type: "confirm",
      name: "exercises",
      message: "Include practice exercises?",
      default: true,
    },
    {
      type: "list",
      name: "formality",
      message: "Writing formality:",
      choices: [
        { name: "Casual — conversational, like a smart friend explaining things", value: "casual" },
        { name: "Balanced — professional but accessible", value: "balanced" },
        { name: "Academic — formal, citation-heavy", value: "academic" },
      ],
    },
  ]);

  // Assemble profile
  const profile = defaultProfile();
  profile.name = identity.name;
  profile.role = identity.role;
  profile.organization = identity.organization;
  profile.interests.primary = interests.primary;
  profile.interests.secondary = interests.secondary;
  profile.interests.curiosity = interests.curiosity;
  profile.goals.style = interests.style;
  profile.goals.description = interests.goals_description;
  profile.open_profile = open_profile.trim();
  profile.preferences.include_exercises = prefs.exercises;
  profile.preferences.formality = prefs.formality;

  // Assemble config
  const config = defaultConfig();
  config.generation.language = identity.language;
  config.generation.template = prefs.template;
  config.generation.output_dir = BOOKS_DIR;

  // Save
  ensureDirectories();
  saveProfile(profile);
  saveConfig(config);

  console.log();
  log.success("Configuration saved!");
  log.info(`Config directory: ${CONFIG_DIR}`);
  log.info(`Books directory: ${BOOKS_DIR}`);

  console.log(chalk.bold("\n— Setup Complete —\n"));
  console.log("Next steps:");
  console.log(`  ${chalk.cyan("bookfactory generate --dry-run")}  — Preview the generation prompt`);
  console.log(`  ${chalk.cyan('bookfactory generate "Topic"')}    — Generate your first book`);
  console.log(`  ${chalk.cyan("bookfactory topics recommend")}    — Get AI topic recommendations`);
  console.log();
}
