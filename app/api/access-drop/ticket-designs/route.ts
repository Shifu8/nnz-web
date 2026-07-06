import { NextRequest, NextResponse } from "next/server";
import { getEventDesignsServer } from "@/lib/tickets/designsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") || "trap-loud";

    const designs = getEventDesignsServer(eventId);
    return NextResponse.json({ success: true, designs });
  } catch (err) {
    console.error("[PUBLIC_DESIGNS_API] Error loading designs:", err);
    return NextResponse.json({ success: false, error: "Error al obtener diseños." }, { status: 500 });
  }
}
