import { NextResponse } from "next/server";
import { z } from "zod";
import { getDrinkSalesSummary, recordDrinkSale, undoLastDrinkSale, resetDrinkSales, updateDrinkCashierName, adjustDrinkStock } from "@/lib/db/drinkSales";
import { handleApiError, readJson } from "@/lib/security";

export const runtime = "nodejs";

const posSchema = z.object({
  action: z.enum(["sale", "undo", "reset", "update_cashier", "adjust_stock"]).default("sale"),
  drinkId: z.string().optional(),
  quantity: z.number().int().min(1).max(50).optional().default(1),
  cashierName: z.string().max(100).optional(),
  bartender: z.string().max(100).optional(),
  stock: z.number().int().min(0).max(1000).optional(),
});

export async function GET() {
  try {
    const summary = getDrinkSalesSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { action, drinkId, quantity, cashierName, bartender, stock } = await readJson(request, posSchema, 1024);

    if (action === "update_cashier" && cashierName !== undefined) {
      const summary = updateDrinkCashierName(cashierName);
      return NextResponse.json({ success: true, summary });
    }

    if (action === "undo") {
      const summary = undoLastDrinkSale(bartender);
      return NextResponse.json({ success: true, summary });
    }

    if (action === "reset") {
      const summary = resetDrinkSales();
      return NextResponse.json({ success: true, summary });
    }

    if (action === "adjust_stock") {
      if (!drinkId || stock === undefined) {
        return NextResponse.json({ error: "Falta bebida o cantidad para ajustar stock" }, { status: 400 });
      }
      const summary = adjustDrinkStock(drinkId, stock);
      return NextResponse.json({ success: true, summary });
    }

    if (!drinkId) {
      return NextResponse.json({ error: "Selecciona la bebida" }, { status: 400 });
    }

    const summary = recordDrinkSale(drinkId, quantity, bartender);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return handleApiError(error);
  }
}
