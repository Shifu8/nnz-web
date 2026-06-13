import fs from "fs";
import path from "path";
import type { HomepageConfig } from "./types";
import { DEFAULT_HOMEPAGE_CONFIG } from "./defaults";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "homepage-config.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadConfig(): HomepageConfig {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw) as HomepageConfig;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_HOMEPAGE_CONFIG;
}

export function saveConfig(config: HomepageConfig): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
