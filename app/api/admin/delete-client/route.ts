import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest, handleApiError } from "@/lib/security";
import { getDbOrNull } from "@/lib/db/postgres";
import { readJsonFile, writeJsonFile } from "@/lib/db/passStore";
import { loadAllReceipts, saveAllReceipts } from "@/lib/access-drop/receiptStore";
import { hashLookup } from "@/lib/security";
import { recordAdminLog } from "@/lib/db/adminLogs";

const deleteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
});

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = deleteSchema.parse(body);
    const email = parsed.email;
    const hash = hashLookup(email);

    // 1. Postgres Database
    const db = getDbOrNull();
    if (db) {
      await db`
        DELETE FROM tickets
        WHERE email_hash = ${hash}
      `;
      await db`
        DELETE FROM ticket_recovery_logs
        WHERE email_hash = ${hash}
      `;
    }

    // 2. Local Fallback JSON for tickets
    const tickets = readJsonFile<any>("tickets");
    const filteredTickets = tickets.filter((t: any) => t.emailHash !== hash);
    writeJsonFile("tickets", filteredTickets);

    // 3. Receipts JSON (completely delete receipts matching this email)
    const receipts = loadAllReceipts();
    const filteredReceipts = receipts.filter((r: any) => r.email?.toLowerCase().trim() !== email);
    saveAllReceipts(filteredReceipts);

    // 4. Local Recovery logs
    const recoveryFile = readJsonFile<any>("ticket-recovery");
    if (recoveryFile && (recoveryFile as any).logs) {
      (recoveryFile as any).logs = (recoveryFile as any).logs.filter((log: any) => log.emailHash !== hash);
      writeJsonFile("ticket-recovery", recoveryFile);
    }

    await recordAdminLog("admin_delete_client", { email });

    return NextResponse.json({
      success: true,
      message: `Cliente ${email} eliminado por completo del CRM.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
