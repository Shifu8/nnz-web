import "server-only";

import fs from "fs";
import path from "path";
import { ensureStore } from "@/lib/db/passStore";

export async function recordAdminLog(action: string, metadata?: Record<string, unknown>) {
  const store = ensureStore();
  const now = new Date().toISOString();

  if (store.kind === "local-json") {
    const file = path.join(process.cwd(), "data", "admin_logs.json");
    let logs: any[] = [];
    if (fs.existsSync(file)) {
      try {
        logs = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {}
    }
    logs.push({ action, metadata: metadata ?? null, createdAt: now });
    if (!fs.existsSync(path.dirname(file))) fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(logs, null, 2), "utf8");
    return;
  }

  if (store.kind === "postgres") {
    await store.db`
      INSERT INTO admin_logs (action, metadata, created_at)
      VALUES (${action}, ${store.db.json(metadata as any ?? null)}, ${now})
    `;
    return;
  }
}
