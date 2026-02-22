import { execSync, spawn } from "node:child_process";
import {
  existsSync,
  writeFileSync,
  unlinkSync,
  readFileSync,
  appendFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { LOCK_FILE, LOGS_DIR } from "../utils/constants.js";
import { log } from "../utils/logger.js";

export interface RunOptions {
  prompt: string;
  maxTurns: number;
  workDir: string;
  logFile?: string;
  onOutput?: (chunk: string) => void;
}

export interface RunResult {
  success: boolean;
  exitCode: number;
  output: string;
  logFile: string;
}

const MAX_RETRIES = 3;
const RETRY_WAIT_MS = 15 * 60 * 1000; // 15 minutes

export function isLocked(): boolean {
  if (!existsSync(LOCK_FILE)) return false;

  // Check if lock is stale (older than 4 hours)
  try {
    const content = readFileSync(LOCK_FILE, "utf-8");
    const pid = parseInt(content.trim(), 10);
    // Check if process is still running
    try {
      process.kill(pid, 0);
      return true; // Process still running
    } catch {
      // Process not running, lock is stale
      unlinkSync(LOCK_FILE);
      return false;
    }
  } catch {
    return false;
  }
}

function acquireLock(): boolean {
  if (isLocked()) return false;
  mkdirSync(dirname(LOCK_FILE), { recursive: true });
  writeFileSync(LOCK_FILE, process.pid.toString(), "utf-8");
  return true;
}

function releaseLock(): void {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
  } catch {
    // ignore
  }
}

function isRateLimitError(output: string): boolean {
  const patterns = [
    "rate limit",
    "rate_limit",
    "Too many requests",
    "429",
    "quota exceeded",
    "overloaded",
  ];
  const lower = output.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runClaude(options: RunOptions): Promise<RunResult> {
  if (!acquireLock()) {
    return {
      success: false,
      exitCode: 1,
      output: "Another bookfactory instance is already running. Remove lock file to force: " + LOCK_FILE,
      logFile: "",
    };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile =
    options.logFile || join(LOGS_DIR, `run_${timestamp}.log`);
  mkdirSync(dirname(logFile), { recursive: true });

  try {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      log.info(
        `Running Claude CLI (attempt ${attempt}/${MAX_RETRIES}, max_turns=${options.maxTurns})...`
      );
      appendFileSync(
        logFile,
        `[${new Date().toISOString()}] Attempt ${attempt} started\n`
      );

      const result = await invokeClaude(options, logFile);

      if (result.success) {
        return result;
      }

      if (isRateLimitError(result.output) && attempt < MAX_RETRIES) {
        const waitMin = (RETRY_WAIT_MS / 60000).toFixed(0);
        log.warn(
          `Rate limited. Waiting ${waitMin} minutes before retry...`
        );
        appendFileSync(
          logFile,
          `[${new Date().toISOString()}] Rate limited, waiting ${waitMin}min\n`
        );
        await sleep(RETRY_WAIT_MS);
      } else if (!result.success) {
        return result;
      }
    }

    return {
      success: false,
      exitCode: 1,
      output: `Failed after ${MAX_RETRIES} attempts`,
      logFile,
    };
  } finally {
    releaseLock();
  }
}

function invokeClaude(
  options: RunOptions,
  logFile: string
): Promise<RunResult> {
  return new Promise((resolve) => {
    const args = [
      "--dangerously-skip-permissions",
      "-p",
      options.prompt,
      "--max-turns",
      options.maxTurns.toString(),
    ];

    const proc = spawn("claude", args, {
      cwd: options.workDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let output = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      appendFileSync(logFile, text);
      options.onOutput?.(text);
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      appendFileSync(logFile, `[stderr] ${text}`);
    });

    proc.on("close", (code) => {
      const exitCode = code ?? 1;
      appendFileSync(
        logFile,
        `\n[${new Date().toISOString()}] Exit code: ${exitCode}\n`
      );
      resolve({
        success: exitCode === 0,
        exitCode,
        output,
        logFile,
      });
    });

    proc.on("error", (err) => {
      const msg = `Failed to start claude CLI: ${err.message}`;
      appendFileSync(logFile, `[error] ${msg}\n`);
      resolve({
        success: false,
        exitCode: 1,
        output: msg,
        logFile,
      });
    });
  });
}
