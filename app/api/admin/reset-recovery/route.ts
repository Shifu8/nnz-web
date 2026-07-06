import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest, handleApiError } from "@/lib/security";
import { resetRecoveryAttempts } from "@/lib/access-drop/recoveryStore";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";
import { recordAdminLog } from "@/lib/db/adminLogs";

const EVENT_ID = "trap-loud";

const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
});

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request, { requireCsrf: false });

    const body = await request.json();
    const parsed = resetSchema.parse(body);
    const event = getActiveTicketEvent();
    const eventId = EVENT_ID;

    await resetRecoveryAttempts(parsed.email, eventId);

    await recordAdminLog("admin_reset_recovery", {
      email: parsed.email,
      eventId,
    });

    return NextResponse.json({
      success: true,
      message: `Límite de recuperaciones reseteado para ${parsed.email}.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
