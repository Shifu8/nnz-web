import "server-only";

import crypto from "crypto";
import { ensureStore } from "@/lib/db/passStore";
import { ApiError, hashLookup } from "@/lib/security";

export type GiveawayEntry = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: string;
};

const memStore = new Map<string, GiveawayEntry>();

function tryEnsureStore() {
  try {
    const store = ensureStore();
    if (store.kind === "local-json") return null;
    return store;
  } catch (err) {
    if (err instanceof ApiError && err.code === "DB_UNAVAILABLE") {
      return null;
    }
    throw err;
  }
}

export async function registerGiveawayEntry(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  ip: string;
  userAgent: string;
}): Promise<{ id: string }> {
  const store = tryEnsureStore();
  const now = new Date().toISOString();

  // In-memory fallback for development
  if (!store) {
    const dup = Array.from(memStore.values()).find(p => p.phone === input.phone);
    if (dup) throw new Error("DUPLICATE_PHONE");
    const id = crypto.randomUUID();
    memStore.set(id, {
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      createdAt: now,
    });
    return { id };
  }

  const phoneHash = hashLookup(input.phone);
  const emailHash = input.email ? hashLookup(input.email) : null;

  if (store.kind === "supabase") {
    const { data: dupPhone } = await store.supabase
      .from("giveaway_entries")
      .select("id")
      .eq("phone_hash", phoneHash)
      .limit(1);
    if (dupPhone?.length) {
      throw new Error("DUPLICATE_PHONE");
    }

    if (emailHash) {
      const { data: dupEmail } = await store.supabase
        .from("giveaway_entries")
        .select("id")
        .eq("email_hash", emailHash)
        .limit(1);
      if (dupEmail?.length) {
        throw new Error("DUPLICATE_EMAIL");
      }
    }

    const id = crypto.randomUUID();
    const { error } = await store.supabase.from("giveaway_entries").insert({
      id,
      full_name: `${input.firstName} ${input.lastName}`.trim(),
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email || null,
      email_hash: emailHash,
      phone: input.phone,
      phone_hash: phoneHash,
      ip_hash: hashLookup(input.ip),
      user_agent_hash: hashLookup(input.userAgent),
      created_at: now,
    });
    if (error) {
      if (error.code === "23505") {
        const msg = error.message || "";
        if (msg.includes("phone_hash")) throw new Error("DUPLICATE_PHONE");
        if (msg.includes("email_hash")) throw new Error("DUPLICATE_EMAIL");
      }
      throw new Error(`DB_ERROR: ${error.message || "Unknown database error"}`);
    }
    return { id };
  }

  const existing = await store.db.collection("giveawayParticipants").where("phone", "==", input.phone).get();
  if (!existing.empty) throw new Error("DUPLICATE_PHONE");

  const id = crypto.randomUUID();
  await store.db.collection("giveawayParticipants").doc(id).set({
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email || null,
    ip: input.ip,
    registeredAt: now,
  });
  return { id };
}

export async function listGiveawayParticipants(limit = 50): Promise<GiveawayEntry[]> {
  const store = tryEnsureStore();

  if (!store) {
    return Array.from(memStore.values()).reverse().slice(0, limit);
  }

  if (store.kind === "supabase") {
    const { data, error } = await store.supabase
      .from("giveaway_entries")
      .select("id,first_name,last_name,phone,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      createdAt: row.created_at,
    }));
  }

  const snap = await store.db
    .collection("giveawayParticipants")
    .orderBy("registeredAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      createdAt: d.registeredAt,
    };
  });
}

export async function countGiveawayParticipants(): Promise<number> {
  const store = tryEnsureStore();

  if (!store) return memStore.size;

  if (store.kind === "supabase") {
    const { count } = await store.supabase
      .from("giveaway_entries")
      .select("id", { count: "exact", head: true });
    return count || 0;
  }

  const snap = await store.db.collection("giveawayParticipants").count().get();
  return snap.data().count;
}

// In-memory winners store (server-side, survives page refreshes)
const winnersStore: WinnerRecord[] = [];

export type WinnerRecord = {
  prize: string;
  participantId: string;
  firstName: string;
  lastName: string;
  phone: string;
  type: "ticket" | "sponsor";
  sponsor?: string;
  emoji?: string;
};

export async function saveGiveawayWinners(winners: WinnerRecord[]): Promise<void> {
  winnersStore.length = 0;
  winnersStore.push(...winners);
}

export async function getGiveawayWinners(): Promise<WinnerRecord[]> {
  return [...winnersStore];
}
