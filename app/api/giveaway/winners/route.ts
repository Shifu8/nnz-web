import { NextResponse } from "next/server";
import { getGiveawayWinners, saveGiveawayWinners, type WinnerRecord } from "@/lib/db/giveawayStore";
import { handleApiError, readJson } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";

const winnerSchema = z.object({
  prize: z.string(),
  participantId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  type: z.enum(["ticket", "sponsor"]),
  sponsor: z.string().optional(),
  emoji: z.string().optional(),
});

const saveSchema = z.object({
  winners: z.array(winnerSchema),
});

export async function GET() {
  try {
    const winners = await getGiveawayWinners();
    return NextResponse.json({ winners });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request, saveSchema);
    await saveGiveawayWinners(body.winners);
    return NextResponse.json({ success: true, count: body.winners.length });
  } catch (error) {
    return handleApiError(error);
  }
}
