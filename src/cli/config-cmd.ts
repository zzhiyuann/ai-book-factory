import chalk from "chalk";
import { log } from "../utils/logger.js";
import {
  loadConfig,
  loadProfile,
  isInitialized,
} from "../profile/manager.js";
import { CONFIG_PATH, PROFILE_PATH, BOOKS_DIR, DATA_DIR, CONFIG_DIR } from "../utils/constants.js";

export async function runConfigShow(): Promise<void> {
  if (!isInitialized()) {
    log.error('Not initialized. Run "bookfactory init" first.');
    process.exit(1);
  }

  const config = loadConfig();
  const profile = loadProfile();

  console.log(chalk.bold("\n📋 Book Factory Configuration\n"));

  console.log(chalk.bold("Paths:"));
  console.log(`  Config:  ${CONFIG_PATH}`);
  console.log(`  Profile: ${PROFILE_PATH}`);
  console.log(`  Books:   ${BOOKS_DIR}`);
  console.log(`  Data:    ${DATA_DIR}`);

  console.log(chalk.bold("\nProfile:"));
  console.log(`  Name:         ${profile.name}`);
  console.log(`  Role:         ${profile.role}`);
  console.log(`  Organization: ${profile.organization}`);
  console.log(`  Interests:    ${profile.interests.primary.join(", ")}`);
  console.log(`  Style:        ${profile.goals.style}`);
  if (profile.open_profile) {
    const preview = profile.open_profile.slice(0, 100);
    console.log(`  Open Profile: ${preview}${profile.open_profile.length > 100 ? "..." : ""}`);
  }

  console.log(chalk.bold("\nGeneration:"));
  console.log(`  Language:     ${config.generation.language}`);
  console.log(`  Template:     ${config.generation.template}`);
  console.log(`  Max Turns:    ${config.generation.max_turns}`);
  console.log(`  Web Research: ${config.generation.web_research.enabled ? config.generation.web_research.depth : "disabled"}`);

  console.log(chalk.bold("\nFormat:"));
  console.log(`  Outputs: ${config.format.outputs.join(", ")}`);
  console.log(`  Style:   ${config.format.style}`);

  console.log(chalk.bold("\nDelivery:"));
  console.log(`  Default: ${config.delivery.default}`);

  console.log(chalk.bold("\nFiles:"));
  console.log(`  ${chalk.cyan(`${CONFIG_DIR}/config.yaml`)} — Edit generation settings`);
  console.log(`  ${chalk.cyan(`${CONFIG_DIR}/profile.yaml`)} — Edit your profile`);
  console.log();
}
