import { NextResponse } from "next/server";
import {
  handleApiError,
  STAFF_CSRF_COOKIE,
  STAFF_SESSION_COOKIE,
  verifyStaffRequest,
} from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const staff = await verifyStaffRequest(request, { requireCsrf: false });
    return Response.json({
      authenticated: true,
      role: staff.role,
      csrfToken: staff.csrfToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyStaffRequest(request, { requireCsrf: false });
  } catch {
    // Continue clearing cookies even for expired sessions.
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(STAFF_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(STAFF_CSRF_COOKIE, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
