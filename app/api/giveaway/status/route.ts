import { NextResponse } from "next/server";
import { getGiveawaySchedule } from "@/lib/giveaway/schedule";
import { getGiveawayWinners } from "@/lib/db/giveawayStore";

export const runtime = "nodejs";

export async function GET() {
  const schedule = getGiveawaySchedule();
  const winners = await getGiveawayWinners();
  return NextResponse.json({ ...schedule, winners });
}
