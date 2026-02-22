import { execSync } from "node:child_process";
import YAML from "yaml";
import { log } from "../utils/logger.js";
import { addBookToGraph, type BookEntry } from "./knowledge-graph.js";

/**
 * After a book is generated, extract key concepts and add to the knowledge graph.
 * Uses a short Claude call to analyze the generated content.
 */
export async function extractAndRecord(
  mdPath: string,
  topic: string,
  template: string
): Promise<void> {
  const { readFileSync } = await import("node:fs");

  let content: string;
  try {
    content = readFileSync(mdPath, "utf-8");
  } catch {
    log.warn("Could not read generated book for knowledge extraction.");
    return;
  }

  // Take first 3000 chars + last 1000 chars for extraction
  const sample =
    content.slice(0, 3000) +
    "\n...\n" +
    content.slice(-1000);

  const prompt = `Analyze this book excerpt and extract metadata as YAML. Output ONLY valid YAML.

\`\`\`
${sample}
\`\`\`

Output format:
\`\`\`yaml
title: "Book Title"
topics:
  - "subtopic1"
  - "subtopic2"
key_concepts:
  - "concept1"
  - "concept2"
  - "concept3"
connections:
  - "related field 1"
  - "related field 2"
\`\`\`

Extract 3-8 subtopics, 5-15 key concepts, and 3-5 connections to other fields.`;

  try {
    const output = execSync(
      `claude -p ${JSON.stringify(prompt)} --max-turns 2`,
      { encoding: "utf-8", timeout: 60000, maxBuffer: 5 * 1024 * 1024 }
    );

    const yamlMatch = output.match(/```ya?ml\n([\s\S]*?)```/);
    const yamlStr = yamlMatch ? yamlMatch[1] : output;
    const parsed = YAML.parse(yamlStr);

    if (parsed) {
      const entry: BookEntry = {
        title: parsed.title || topic,
        topic,
        date: new Date().toISOString().split("T")[0],
        template,
        topics: parsed.topics || [],
        key_concepts: parsed.key_concepts || [],
        connections: parsed.connections || [],
      };
      addBookToGraph(entry);
      log.success("Knowledge graph updated.");
    }
  } catch {
    // Non-critical — just log and continue
    log.warn("Knowledge extraction skipped (Claude call failed).");

    // Still record basic entry
    addBookToGraph({
      title: topic,
      topic,
      date: new Date().toISOString().split("T")[0],
      template,
      topics: [],
      key_concepts: [],
      connections: [],
    });
  }
}
