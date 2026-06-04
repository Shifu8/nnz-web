import "server-only";

import { ensureStore } from "@/lib/db/passStore";

export async function recordAdminLog(action: string, metadata?: Record<string, unknown>) {
  const store = ensureStore();
  const now = new Date().toISOString();

  if (store.kind === "supabase") {
    await store.supabase.from("admin_logs").insert({
      action,
      metadata: metadata ?? null,
      created_at: now,
    });
    return;
  }

  await store.db.collection("adminLogs").add({
    action,
    metadata: metadata ?? null,
    createdAt: now,
  });
}
