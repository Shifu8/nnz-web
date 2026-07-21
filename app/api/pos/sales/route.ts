import { NextResponse } from "next/server";
import { z } from "zod";
import { getPosSalesSummary, recordPosSale, undoLastPosSale, resetPosSales, updateCashierName } from "@/lib/db/posSales";
import { handleApiError, readJson } from "@/lib/security";

export const runtime = "nodejs";

const posSchema = z.object({
  action: z.enum(["sale", "undo", "reset", "update_cashier"]).default("sale"),
  type: z.enum(["student", "general"]).optional(),
  quantity: z.number().int().min(1).max(50).optional().default(1),
  cashierName: z.string().max(100).optional(),
});

export async function GET() {
  try {
    const summary = getPosSalesSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { action, type, quantity, cashierName } = await readJson(request, posSchema, 1024);

    if (action === "update_cashier" && cashierName !== undefined) {
      const summary = updateCashierName(cashierName);
      return NextResponse.json({ success: true, summary });
    }

    if (action === "undo") {
      const summary = undoLastPosSale();
      return NextResponse.json({ success: true, summary });
    }

    if (action === "reset") {
      const summary = resetPosSales();
      return NextResponse.json({ success: true, summary });
    }

    if (!type) {
      return NextResponse.json({ error: "Selecciona el tipo de entrada" }, { status: 400 });
    }

    const summary = recordPosSale(type, quantity);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return handleApiError(error);
  }
}
