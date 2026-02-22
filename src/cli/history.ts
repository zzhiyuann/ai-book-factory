import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import chalk from "chalk";
import { log } from "../utils/logger.js";
import { BOOKS_DIR } from "../utils/constants.js";

export async function runHistory(): Promise<void> {
  if (!existsSync(BOOKS_DIR)) {
    log.info("No books generated yet.");
    return;
  }

  const entries = readdirSync(BOOKS_DIR)
    .filter((f) => {
      const fp = join(BOOKS_DIR, f);
      return statSync(fp).isDirectory();
    })
    .sort()
    .reverse();

  if (entries.length === 0) {
    log.info("No books generated yet.");
    return;
  }

  console.log(chalk.bold("\n📚 Generation History\n"));

  for (const dateDir of entries.slice(0, 20)) {
    const dirPath = join(BOOKS_DIR, dateDir);
    const mdFiles = readdirSync(dirPath).filter((f) => f.endsWith(".md"));

    if (mdFiles.length > 0) {
      console.log(chalk.bold(`  ${dateDir}`));
      for (const md of mdFiles) {
        const name = basename(md, ".md")
          .replace(/^\d{4}_/, "")
          .replace(/_/g, " ");
        const htmlExists = existsSync(join(dirPath, md.replace(".md", ".html")));
        const pdfExists = existsSync(join(dirPath, md.replace(".md", ".pdf")));
        const formats = [
          "md",
          htmlExists ? "html" : null,
          pdfExists ? "pdf" : null,
        ]
          .filter(Boolean)
          .join(", ");

        console.log(`    ${chalk.cyan("•")} ${name} ${chalk.gray(`[${formats}]`)}`);
      }
    }
  }

  if (entries.length > 20) {
    console.log(chalk.gray(`\n  ... and ${entries.length - 20} more dates`));
  }

  console.log();
}
