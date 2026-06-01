import { NextResponse } from "next/server";
import { getGiveawaySchedule } from "@/lib/giveaway/schedule";

export const runtime = "nodejs";

export async function GET() {
  const schedule = getGiveawaySchedule();
  return NextResponse.json({
    serverTime: schedule.serverTime,
    targetTime: schedule.openAt,
    closeTime: schedule.closeAt,
    phase: schedule.phase,
    msUntilOpen: schedule.msUntilOpen,
    msUntilClose: schedule.msUntilClose,
  });
}
