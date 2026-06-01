type LogLevel = "info" | "warn" | "error" | "debug";

const LOG_LEVEL = (process.env.BAILEYS_LOG_LEVEL || "info") as LogLevel;

const LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const THRESHOLD = LEVELS[LOG_LEVEL] ?? 2;

function log(level: LogLevel, tag: string, msg: string, data?: unknown) {
  if (LEVELS[level] > THRESHOLD) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${tag}]`;
  const line = data ? `${prefix} ${msg} ${JSON.stringify(data)}` : `${prefix} ${msg}`;
  if (level === "error") console.error(line);
  else console.log(line);
}

export const waLogger = {
  info: (tag: string, msg: string, data?: unknown) => log("info", tag, msg, data),
  warn: (tag: string, msg: string, data?: unknown) => log("warn", tag, msg, data),
  error: (tag: string, msg: string, data?: unknown) => log("error", tag, msg, data),
  debug: (tag: string, msg: string, data?: unknown) => log("debug", tag, msg, data),
};
