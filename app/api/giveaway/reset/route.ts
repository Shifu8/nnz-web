import { NextResponse } from "next/server";
import { resetGiveawaySchedule } from "@/lib/giveaway/schedule";

export const runtime = "nodejs";

export async function POST() {
  resetGiveawaySchedule();
  return NextResponse.json({ success: true });
}
