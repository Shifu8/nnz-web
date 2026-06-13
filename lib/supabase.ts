import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;

function isPlaceholder(value: string): boolean {
  return /(your[-_\s]|example|placeholder|changeme|xxxxx|project-id|service-role-key|<|>)/i.test(value);
}

export function getSupabaseDiagnostics() {
  const url = process.env.SUPABASE_URL?.trim() || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const configured = Boolean(url && key && !isPlaceholder(url) && !isPlaceholder(key));

  let host = "";
  if (url) {
    try {
      host = new URL(url).host;
    } catch {
      host = "invalid-url";
    }
  }

  return {
    configured,
    host,
    reason: configured
      ? undefined
      : !url || !key
        ? "missing-credentials"
        : "placeholder-or-invalid-credentials",
  };
}

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key || isPlaceholder(url) || isPlaceholder(key)) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return supabaseAdmin;
}

export function requireSupabase() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error("Supabase no configurado. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  }
  return client;
}
