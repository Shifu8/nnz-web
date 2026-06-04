import { NextResponse } from "next/server";
import { listGiveawayParticipants } from "@/lib/db/giveawayStore";

export const runtime = "nodejs";

function maskPhone(phone: string) {
  if (phone.length < 6) return "******";
  return phone.slice(0, 3) + "*******";
}

export async function GET() {
  try {
    const participants = await listGiveawayParticipants(500);
    return NextResponse.json({
      participants: participants.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: maskPhone(p.phone),
      })),
      total: participants.length,
    });
  } catch {
    return NextResponse.json({ participants: [], total: 0 });
  }
}
