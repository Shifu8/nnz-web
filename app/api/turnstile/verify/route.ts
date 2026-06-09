import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, enforceRateLimit, handleApiError, readJson } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

const verifySchema = z.object({
  turnstileToken: z.string().max(2048).optional(),
  action: z.enum(["admin_login"]),
  variant: z.enum(["visible", "invisible"]).default("visible"),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "turnstile-verify", limit: 20, windowMs: 5 * 60_000 });

    const body = await readJson(request, verifySchema, 4096);
    await verifyTurnstileToken(request, body.turnstileToken, {
      variant: body.variant,
      action: body.action,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
