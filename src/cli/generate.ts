import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import chalk from "chalk";
import { log } from "../utils/logger.js";
import { loadConfig, loadProfile, isInitialized } from "../profile/manager.js";
import { getTemplate } from "../templates/registry.js";
import { buildPrompt } from "../core/prompt-builder.js";
import { runClaude, isLocked } from "../core/claude-runner.js";
import { formatBook } from "../format/converter.js";
import { getDeliveryPlugin } from "../delivery/registry.js";
import { buildKnowledgeContext } from "../topics/knowledge-graph.js";
import { extractAndRecord } from "../topics/extractor.js";
import { BOOKS_DIR } from "../utils/constants.js";

export interface GenerateOptions {
  template?: string;
  dryRun?: boolean;
  nonInteractive?: boolean;
  output?: string;
  maxTurns?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
}

export async function runGenerate(
  topic: string | undefined,
  options: GenerateOptions
): Promise<void> {
  // Check initialization
  if (!isInitialized()) {
    log.error('Not initialized. Run "bookfactory init" first.');
    process.exit(1);
  }

  // Load config and profile
  const config = loadConfig();
  const profile = loadProfile();

  // Determine topic
  if (!topic) {
    log.error("Please specify a topic: bookfactory generate \"Topic Name\"");
    process.exit(1);
  }

  // Resolve template
  const templateName = options.template || config.generation.template;
  const template = getTemplate(templateName);
  if (!template) {
    log.error(`Template "${templateName}" not found. Available: deep-dive, comprehensive, quick-read, practical-guide`);
    process.exit(1);
  }

  // Setup output path
  const today = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().slice(0, 5).replace(":", "");
  const slug = slugify(topic);
  const outputDir = options.output
    ? resolve(options.output)
    : join(config.generation.output_dir || BOOKS_DIR, today);
  const fileName = `${time}_${slug}.md`;
  const outputPath = join(outputDir, fileName);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Build conversion command
  const conversionCmd = `bookfactory format "${outputPath}"`;

  // Build knowledge context from previous books
  const knowledgeContext = buildKnowledgeContext();

  // Assemble prompt
  const prompt = buildPrompt({
    profile,
    config,
    template,
    topic,
    topicContext: knowledgeContext || undefined,
    outputPath,
    conversionCommand: conversionCmd,
  });

  // Dry run — just print the prompt
  if (options.dryRun) {
    console.log(chalk.bold("\n═══ DRY RUN — Assembled Prompt ═══\n"));
    console.log(prompt);
    console.log(chalk.bold("\n═══ End of Prompt ═══\n"));

    const wordCount = prompt.split(/\s+/).length;
    console.log(chalk.gray(`Prompt: ~${wordCount} words`));
    console.log(chalk.gray(`Template: ${template.display_name}`));
    console.log(chalk.gray(`Target: ${template.target_words.min.toLocaleString()}–${template.target_words.max.toLocaleString()} words`));
    console.log(chalk.gray(`Output: ${outputPath}`));
    return;
  }

  // Check lock
  if (isLocked()) {
    log.error("Another generation is in progress. Wait or remove the lock file.");
    process.exit(1);
  }

  // Run generation
  console.log();
  log.info(`Generating book: ${chalk.bold(topic)}`);
  log.info(`Template: ${template.display_name} (${template.target_words.min.toLocaleString()}–${template.target_words.max.toLocaleString()} words)`);
  log.info(`Output: ${outputPath}`);
  console.log();

  const maxTurns = options.maxTurns || config.generation.max_turns;

  // Build the full prompt for Claude CLI
  // Claude will handle the research, writing, and file saving
  const fullPrompt = `${prompt}

IMPORTANT: Save the completed book to: ${outputPath}
After saving, confirm the file has been written.`;

  const result = await runClaude({
    prompt: fullPrompt,
    maxTurns,
    workDir: outputDir,
    onOutput: (chunk) => {
      if (!options.nonInteractive) {
        process.stdout.write(chalk.gray("."));
      }
    },
  });

  if (!options.nonInteractive) console.log(); // newline after dots

  if (!result.success) {
    log.error(`Generation failed (exit code ${result.exitCode}).`);
    log.info(`Log: ${result.logFile}`);
    process.exit(1);
  }

  log.success("Book generated!");

  // Format conversion
  if (existsSync(outputPath)) {
    try {
      const formatted = await formatBook(outputPath, {
        outputs: config.format.outputs,
        style: config.format.style,
        customCSS: config.format.custom_css || undefined,
      });

      // Delivery
      const deliveryName = config.delivery.default;
      if (deliveryName && deliveryName !== "local") {
        const plugin = getDeliveryPlugin(deliveryName);
        if (plugin?.isConfigured()) {
          const deliverPath = formatted.html || outputPath;
          await plugin.deliver({
            filePath: deliverPath,
            title: topic,
            caption: `New book: ${topic}`,
          });
        }
      }
    } catch (err) {
      log.warn(`Format/delivery issue: ${err}`);
    }
    // Update knowledge graph
    try {
      await extractAndRecord(outputPath, topic, templateName);
    } catch {
      log.warn("Knowledge graph update skipped.");
    }
  } else {
    log.warn(`Expected output file not found: ${outputPath}`);
    log.info("The book may have been saved to a different path by Claude. Check the log.");
  }

  log.info(`Log: ${result.logFile}`);
}
