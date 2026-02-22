import { homedir } from "node:os";
import { join } from "node:path";

export const APP_NAME = "bookfactory";
export const CONFIG_DIR = join(homedir(), ".config", APP_NAME);
export const DATA_DIR = join(homedir(), ".local", "share", APP_NAME);
export const CONFIG_PATH = join(CONFIG_DIR, "config.yaml");
export const PROFILE_PATH = join(CONFIG_DIR, "profile.yaml");
export const BOOKS_DIR = join(DATA_DIR, "books");
export const BACKLOG_PATH = join(DATA_DIR, "backlog.yaml");
export const KNOWLEDGE_GRAPH_PATH = join(DATA_DIR, "knowledge-graph.yaml");
export const HISTORY_PATH = join(DATA_DIR, "history.yaml");
export const LOGS_DIR = join(DATA_DIR, "logs");
export const LOCK_FILE = join(DATA_DIR, ".bookfactory.lock");
export const TEMPLATES_DIR = join(CONFIG_DIR, "templates");
