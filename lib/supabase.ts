import { createClient } from "@supabase/supabase-js";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;

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
