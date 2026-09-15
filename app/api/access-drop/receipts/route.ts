import { NextRequest, NextResponse } from "next/server";
import { loadAllReceipts } from "@/lib/access-drop/receiptStore";
import type { ReceiptStatus } from "@/lib/access-drop/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ReceiptStatus | null;
    const search = searchParams.get("search")?.toLowerCase();
    const eventId = searchParams.get("eventId");
    const eventTitle = searchParams.get("eventTitle");
    const email = searchParams.get("email")?.toLowerCase().trim();

    let receipts = loadAllReceipts();

    if (email) {
      receipts = receipts.filter((r) => r.email?.toLowerCase().trim() === email);
    }

    if (eventId || eventTitle) {
      receipts = receipts.filter((r) => {
        const eId = (r.eventId || "").toLowerCase().trim();
        const eTitle = (r.eventTitle || "").toLowerCase().trim();
        const targetId = (eventId || "").toLowerCase().trim();
        const targetTitle = (eventTitle || "").toLowerCase().trim();

        if (targetId && (eId === targetId || eId.includes(targetId))) return true;
        if (targetTitle && (eTitle === targetTitle || eTitle.includes(targetTitle) || eId.includes(targetTitle))) return true;
        return false;
      });
    }

    if (status) {
      receipts = receipts.filter((r) => r.status === status);
    }

    if (search) {
      receipts = receipts.filter(
        (r) =>
          r.firstName.toLowerCase().includes(search) ||
          r.lastName.toLowerCase().includes(search) ||
          r.phone.includes(search) ||
          r.referenceNumber.toLowerCase().includes(search) ||
          r.serialNumber?.toLowerCase().includes(search)
      );
    }

    receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ receipts, total: receipts.length });
  } catch (err) {
    console.error("Error listing receipts:", err);
    return NextResponse.json({ error: "ERROR INTERNO." }, { status: 500 });
  }
}
