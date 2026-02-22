import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import YAML from "yaml";
import { KNOWLEDGE_GRAPH_PATH } from "../utils/constants.js";

export interface BookEntry {
  title: string;
  topic: string;
  date: string;
  template: string;
  topics: string[];
  key_concepts: string[];
  connections: string[];
}

export interface KnowledgeGraph {
  books: BookEntry[];
}

export function loadKnowledgeGraph(): KnowledgeGraph {
  if (!existsSync(KNOWLEDGE_GRAPH_PATH)) {
    return { books: [] };
  }
  const raw = readFileSync(KNOWLEDGE_GRAPH_PATH, "utf-8");
  return YAML.parse(raw) || { books: [] };
}

export function saveKnowledgeGraph(graph: KnowledgeGraph): void {
  mkdirSync(dirname(KNOWLEDGE_GRAPH_PATH), { recursive: true });
  writeFileSync(KNOWLEDGE_GRAPH_PATH, YAML.stringify(graph), "utf-8");
}

export function addBookToGraph(entry: BookEntry): void {
  const graph = loadKnowledgeGraph();
  graph.books.push(entry);
  saveKnowledgeGraph(graph);
}

/** Get all concepts the user has already covered */
export function getCoveredConcepts(): string[] {
  const graph = loadKnowledgeGraph();
  const concepts = new Set<string>();
  for (const book of graph.books) {
    for (const c of book.key_concepts) concepts.add(c);
    for (const t of book.topics) concepts.add(t);
  }
  return [...concepts];
}

/** Get topics already generated (to avoid repetition) */
export function getCompletedTopics(): string[] {
  const graph = loadKnowledgeGraph();
  return graph.books.map((b) => b.topic);
}

/** Build context string for prompt injection — tells AI what user already knows */
export function buildKnowledgeContext(): string {
  const graph = loadKnowledgeGraph();
  if (graph.books.length === 0) return "";

  const lines: string[] = [
    "The reader has previously generated these books (avoid repetition, build on prior knowledge):",
  ];

  for (const book of graph.books.slice(-20)) {
    lines.push(`- "${book.topic}" (${book.date}) — concepts: ${book.key_concepts.slice(0, 5).join(", ")}`);
  }

  const allConcepts = getCoveredConcepts();
  if (allConcepts.length > 0) {
    lines.push("");
    lines.push(`Concepts already covered (assume familiarity): ${allConcepts.slice(0, 30).join(", ")}`);
  }

  return lines.join("\n");
}
