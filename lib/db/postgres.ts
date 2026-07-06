import "server-only";

import postgres from "postgres";

let _db: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim();
}

/**
 * Returns the postgres connection pool, or null if DATABASE_URL is not set.
 * Uses a module-level singleton so connections are reused across requests.
 */
export function getDbOrNull(): ReturnType<typeof postgres> | null {
  const url = getDatabaseUrl();
  if (
    !url ||
    url.includes("your-") ||
    url.includes("@host") ||
    url.includes("user:password") ||
    url.includes("placeholder")
  ) {
    return null;
  }

  if (!_db) {
    _db = postgres(url, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      // For Aurora Serverless which can have cold starts
      connection: {
        application_name: "nenez-web",
      },
    });
  }
  return _db;
}

/**
 * Returns the postgres connection pool.
 * Throws if DATABASE_URL is not configured (production check).
 */
export function getDb(): ReturnType<typeof postgres> {
  const db = getDbOrNull();
  if (!db) {
    throw new Error(
      "DATABASE_URL no está configurado. Agrega DATABASE_URL=postgresql://... a tus variables de entorno.",
    );
  }
  return db;
}
