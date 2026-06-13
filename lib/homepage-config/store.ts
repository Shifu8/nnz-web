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

function mergeDeep(defaults: HomepageConfig, overrides: Partial<HomepageConfig>): HomepageConfig {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof HomepageConfig)[]) {
    const d = defaults[key];
    const o = (overrides as any)[key];
    if (o === undefined || o === null) continue;
    if (Array.isArray(d) && Array.isArray(o)) {
      (result as any)[key] = o;
    } else if (typeof d === "object" && !Array.isArray(d) && typeof o === "object") {
      (result as any)[key] = { ...d as any, ...o as any };
    } else {
      (result as any)[key] = o;
    }
  }
  return result;
}

export function loadConfig(): HomepageConfig {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      const saved = JSON.parse(raw) as Partial<HomepageConfig>;
      return mergeDeep(DEFAULT_HOMEPAGE_CONFIG, saved);
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
