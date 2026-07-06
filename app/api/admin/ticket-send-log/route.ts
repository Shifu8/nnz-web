import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest, handleApiError } from "@/lib/security";
import { ensureStore, readJsonFile, writeJsonFile } from "@/lib/db/passStore";

const LOG_TABLE = "ticket_send_logs";
const LOG_FILE = "ticket-send-log";

type SendLogEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  quantity: number;
  designName: string;
  sentAt: string; // ISO string
};

const entrySchema = z.object({
  id: z.string().min(1).max(80),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(50),
  designName: z.string().min(1).max(120),
  sentAt: z.string().datetime(),
});

// GET — load all log entries (most recent first)
export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const store = ensureStore();

    if (store.kind === "postgres") {
      try {
        const rows = await store.db`
          SELECT id, first_name, last_name, email, quantity, design_name, sent_at
          FROM ticket_send_logs
          ORDER BY sent_at DESC
          LIMIT 200
        `;

        const entries: SendLogEntry[] = rows.map((row: any) => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          quantity: row.quantity,
          designName: row.design_name,
          sentAt: new Date(row.sent_at).toISOString(),
        }));

        return NextResponse.json({ success: true, entries });
      } catch (error: any) {
        // Table might not exist yet — fall through to local json
        if (error.code === "42P01") {
          const raw = readJsonFile<SendLogEntry>(LOG_FILE);
          return NextResponse.json({ success: true, entries: raw });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    // local-json fallback
    const raw = readJsonFile<SendLogEntry>(LOG_FILE);
    return NextResponse.json({ success: true, entries: raw });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — append a new log entry
export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = entrySchema.parse(body);

    const store = ensureStore();

    if (store.kind === "postgres") {
      try {
        await store.db`
          INSERT INTO ticket_send_logs (
            id, first_name, last_name, email, quantity, design_name, sent_at
          ) VALUES (
            ${parsed.id}, ${parsed.firstName}, ${parsed.lastName}, ${parsed.email},
            ${parsed.quantity}, ${parsed.designName}, ${parsed.sentAt}
          )
        `;
        return NextResponse.json({ success: true });
      } catch (error: any) {
        // If the table doesn't exist, silently fall through to JSON file
        if (error.code !== "42P01") {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
      }
    }

    // local-json fallback
    const existing = readJsonFile<SendLogEntry>(LOG_FILE);
    // Prepend so latest is first
    const updated = [parsed, ...existing.filter((e) => e.id !== parsed.id)];
    writeJsonFile(LOG_FILE, updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
