import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest, handleApiError } from "@/lib/security";
import { getDbOrNull } from "@/lib/db/postgres";
import { readJsonFile, writeJsonFile } from "@/lib/db/passStore";
import { loadAllReceipts, saveAllReceipts } from "@/lib/access-drop/receiptStore";
import { hashLookup } from "@/lib/security";
import { recordAdminLog } from "@/lib/db/adminLogs";

const clearSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
});

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = clearSchema.parse(body);
    const email = parsed.email;
    const hash = hashLookup(email);

    // 1. Postgres Database
    const db = getDbOrNull();
    if (db) {
      await db`
        DELETE FROM tickets
        WHERE email_hash = ${hash}
      `;
    }

    // 2. Local Fallback JSON for tickets
    const tickets = readJsonFile<any>("tickets");
    const filteredTickets = tickets.filter((t: any) => t.emailHash !== hash);
    writeJsonFile("tickets", filteredTickets);

    // 3. Receipts JSON (set status of approved receipts to 'rechazado')
    const receipts = loadAllReceipts();
    const updatedReceipts = receipts.map((r: any) => {
      if (r.email?.toLowerCase().trim() === email && r.status === "aprobado") {
        return {
          ...r,
          status: "rechazado",
          rejectionReason: "Entradas vaciadas manualmente por el administrador",
          reviewedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    saveAllReceipts(updatedReceipts);

    await recordAdminLog("admin_clear_client_tickets", { email });

    return NextResponse.json({
      success: true,
      message: `Entradas vaciadas con éxito para ${email}.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
