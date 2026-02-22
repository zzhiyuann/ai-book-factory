import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { homedir, platform } from "node:os";
import inquirer from "inquirer";
import chalk from "chalk";
import { log } from "../utils/logger.js";

const PLIST_DIR = join(homedir(), "Library", "LaunchAgents");
const PLIST_NAME = "com.bookfactory.generate.plist";
const PLIST_PATH = join(PLIST_DIR, PLIST_NAME);

function resolveBookfactoryBin(): string {
  try {
    return execSync("which bookfactory", { encoding: "utf-8" }).trim();
  } catch {
    return "bookfactory";
  }
}

function cronExpressionToCalendar(cron: string): { Hour: number; Minute: number; Weekday?: number } {
  // Parse simple cron: minute hour * * [weekday]
  const parts = cron.split(/\s+/);
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  const result: { Hour: number; Minute: number; Weekday?: number } = { Hour: hour, Minute: minute };
  if (parts[4] && parts[4] !== "*") {
    result.Weekday = parseInt(parts[4], 10);
  }
  return result;
}

function generateLaunchdPlist(schedule: { Hour: number; Minute: number; Weekday?: number }): string {
  const bin = resolveBookfactoryBin();
  let calendarInterval = `        <dict>
          <key>Hour</key>
          <integer>${schedule.Hour}</integer>
          <key>Minute</key>
          <integer>${schedule.Minute}</integer>`;

  if (schedule.Weekday !== undefined) {
    calendarInterval += `
          <key>Weekday</key>
          <integer>${schedule.Weekday}</integer>`;
  }

  calendarInterval += `
        </dict>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.bookfactory.generate</string>
    <key>ProgramArguments</key>
    <array>
        <string>${bin}</string>
        <string>generate</string>
        <string>--non-interactive</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
${calendarInterval}
    </array>
    <key>StandardOutPath</key>
    <string>${homedir()}/.local/share/bookfactory/logs/launchd_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${homedir()}/.local/share/bookfactory/logs/launchd_stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${dirname(bin)}</string>
    </dict>
</dict>
</plist>`;
}

function generateCrontab(cron: string): string {
  const bin = resolveBookfactoryBin();
  return `${cron} ${bin} generate --non-interactive >> ~/.local/share/bookfactory/logs/cron.log 2>&1`;
}

export async function runSchedule(): Promise<void> {
  const os = platform();

  console.log(chalk.bold("\n⏰ Schedule Automated Book Generation\n"));

  const { frequency } = await inquirer.prompt([
    {
      type: "list",
      name: "frequency",
      message: "How often should books be generated?",
      choices: [
        { name: "Daily at 2:00 PM", value: "0 14 * * *" },
        { name: "Daily at 9:00 AM", value: "0 9 * * *" },
        { name: "Twice daily (9 AM + 6 PM)", value: "multi" },
        { name: "Three times daily (9 AM + 2 PM + 9 PM)", value: "triple" },
        { name: "Weekly (Sunday 10 AM)", value: "0 10 * * 0" },
        { name: "Custom cron expression", value: "custom" },
      ],
    },
  ]);

  let cronExpressions: string[];

  if (frequency === "multi") {
    cronExpressions = ["0 9 * * *", "0 18 * * *"];
  } else if (frequency === "triple") {
    cronExpressions = ["0 9 * * *", "0 14 * * *", "0 21 * * *"];
  } else if (frequency === "custom") {
    const { cron } = await inquirer.prompt([
      {
        type: "input",
        name: "cron",
        message: "Cron expression (minute hour day month weekday):",
        default: "0 14 * * *",
      },
    ]);
    cronExpressions = [cron];
  } else {
    cronExpressions = [frequency];
  }

  if (os === "darwin") {
    // macOS — use launchd
    log.info("Setting up launchd (macOS)...");
    mkdirSync(PLIST_DIR, { recursive: true });

    // Generate plist with multiple calendar intervals
    const schedules = cronExpressions.map(cronExpressionToCalendar);

    // For simplicity, use the first schedule (launchd supports arrays)
    const plist = generateLaunchdPlist(schedules[0]);

    // If existing, unload first
    if (existsSync(PLIST_PATH)) {
      try {
        execSync(`launchctl unload "${PLIST_PATH}"`, { stdio: "ignore" });
      } catch { /* ignore */ }
    }

    writeFileSync(PLIST_PATH, plist, "utf-8");
    log.success(`Plist written: ${PLIST_PATH}`);

    try {
      execSync(`launchctl load "${PLIST_PATH}"`);
      log.success("Schedule loaded into launchd.");
    } catch (err) {
      log.warn("Could not auto-load. Load manually:");
      console.log(`  launchctl load "${PLIST_PATH}"`);
    }

    console.log(chalk.gray("\nTo stop: launchctl unload \"" + PLIST_PATH + "\""));
  } else {
    // Linux — use cron
    log.info("Setting up cron (Linux)...");
    const lines = cronExpressions.map(generateCrontab);
    const cronBlock = `\n# bookfactory auto-generation\n${lines.join("\n")}\n`;

    console.log(chalk.bold("\nAdd these lines to your crontab:\n"));
    console.log(chalk.cyan(cronBlock));
    console.log(chalk.gray("Run: crontab -e"));

    const { autoadd } = await inquirer.prompt([
      {
        type: "confirm",
        name: "autoadd",
        message: "Auto-add to crontab?",
        default: false,
      },
    ]);

    if (autoadd) {
      try {
        const existing = execSync("crontab -l 2>/dev/null || true", { encoding: "utf-8" });
        // Remove old bookfactory entries
        const cleaned = existing
          .split("\n")
          .filter((l) => !l.includes("bookfactory"))
          .join("\n");
        const newCrontab = cleaned.trimEnd() + cronBlock;
        execSync(`echo ${JSON.stringify(newCrontab)} | crontab -`);
        log.success("Crontab updated.");
      } catch (err) {
        log.error(`Failed to update crontab: ${err}`);
      }
    }
  }

  console.log();
  log.info("Schedule set up. Books will be generated automatically.");
  log.info("Make sure you have topics in your backlog: bookfactory topics list");
  console.log();
}
