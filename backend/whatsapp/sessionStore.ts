import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import type { AuthenticationState, AuthenticationCreds } from "@whiskeysockets/baileys";
import { BufferJSON, initAuthCreds } from "@whiskeysockets/baileys";

const SESSION_DIR = process.env.BAILEYS_SESSION_DIR || "wa_session";

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function filePath(jid: string): string {
  return join(SESSION_DIR, `${jid}.json`);
}

export function useFileAuthState(): { state: AuthenticationState; saveCreds: () => void } {
  ensureDir(SESSION_DIR);

  let creds: AuthenticationCreds;

  const credsPath = filePath("creds");

  if (existsSync(credsPath)) {
    const raw = readFileSync(credsPath, "utf-8");
    const parsed = JSON.parse(raw, BufferJSON.reviver);
    creds = parsed.creds;
  } else {
    creds = initAuthCreds();
    saveCreds();
  }

  function saveCreds() {
    ensureDir(SESSION_DIR);
    writeFileSync(credsPath, JSON.stringify({ creds }, BufferJSON.replacer, 2));
  }

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const data: Record<string, unknown> = {};
        for (const id of ids) {
          const path = filePath(`${type}-${id}`);
          if (existsSync(path)) {
            data[id] = JSON.parse(readFileSync(path, "utf-8"), BufferJSON.reviver);
          }
        }
        return data as any;
      },
      set: async (data) => {
        for (const category in data) {
          const entries = (data as any)[category];
          if (entries) {
            for (const id in entries) {
              const value = entries[id];
              if (value) {
                const path = filePath(`${category}-${id}`);
                ensureDir(SESSION_DIR);
                writeFileSync(path, JSON.stringify(value, BufferJSON.replacer));
              }
            }
          }
        }
      },
    },
  };

  return { state, saveCreds };
}

export function clearSession() {
  if (existsSync(SESSION_DIR)) {
    const files = readdirSync(SESSION_DIR);
    for (const f of files) {
      rmSync(join(SESSION_DIR, f), { force: true });
    }
  }
}

export function hasSession(): boolean {
  return existsSync(join(SESSION_DIR, "creds.json"));
}
