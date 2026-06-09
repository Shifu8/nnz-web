import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/adminApp";
import {
  assertSameOrigin,
  createStaffSessionJwt,
  enforceRateLimit,
  handleApiError,
  readJson,
  STAFF_CSRF_COOKIE,
  STAFF_SESSION_COOKIE,
  verifyRolePassword,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

const loginSchema = z.object({
  password: z.string().min(6).max(160),
  role: z.enum(["staff", "admin"]).default("staff"),
  turnstileToken: z.string().max(2048).optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "staff-login", limit: 5, windowMs: 5 * 60_000 });

    const { password, role, turnstileToken } = await readJson(request, loginSchema, 4096);
    if (role === "admin") {
      await verifyTurnstileToken(request, turnstileToken, {
        variant: "invisible",
        action: "admin_login",
      });
    }

    const isValid = await verifyRolePassword(password, role);

    if (!isValid) {
      return NextResponse.json({ error: "ACCESO DENEGADO" }, { status: 401 });
    }

    const sessionId = crypto.randomUUID();
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const sessionToken = await createStaffSessionJwt(sessionId, csrfToken, role);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

    if (adminDb) {
      await adminDb.collection("staffSessions").doc(sessionId).set({
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
    }

    const response = NextResponse.json({
      success: true,
      role,
      csrfToken,
      expiresAt: expiresAt.toISOString(),
    });

    response.cookies.set(STAFF_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });

    response.cookies.set(STAFF_CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
