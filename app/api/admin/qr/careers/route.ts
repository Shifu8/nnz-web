import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readJson,
} from "@/lib/security";
import { loadCareers, saveCareers, resetCareers, type CareerEntry } from "@/lib/staff/careerStore";
import { invalidateCareerCache } from "@/lib/staff/utplCard";

export const runtime = "nodejs";

function verifyAdmin(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) throw new ApiError(401, "No autorizado.", "UNAUTHORIZED");
  const decoded = Buffer.from(auth.replace("Bearer ", ""), "base64").toString("utf-8");
  const [user, pass] = decoded.split(":", 2);
  if (user !== "admin" || pass !== "nenez2026") {
    throw new ApiError(401, "Credenciales invalidas.", "UNAUTHORIZED");
  }
}

const createSchema = z.object({
  id: z.string().min(2).max(40),
  label: z.string().min(2).max(100),
  patterns: z.array(z.string().min(1)).min(1),
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  try {
    const careers = loadCareers();
    return NextResponse.json({ careers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "admin-careers", limit: 30, windowMs: 60_000 });
    verifyAdmin(request);

    const body = await readJson(request, createSchema);
    const careers = loadCareers();

    if (careers.some((c) => c.id === body.id)) {
      const idx = careers.findIndex((c) => c.id === body.id);
      careers[idx] = { id: body.id, label: body.label, patterns: body.patterns };
    } else {
      careers.push({ id: body.id, label: body.label, patterns: body.patterns });
    }

    saveCareers(careers);
    invalidateCareerCache();

    return NextResponse.json({ success: true, careers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, { namespace: "admin-careers", limit: 30, windowMs: 60_000 });
    verifyAdmin(request);

    const body = await readJson(request, deleteSchema);
    let careers = loadCareers();
    careers = careers.filter((c) => c.id !== body.id);
    saveCareers(careers);
    invalidateCareerCache();

    return NextResponse.json({ success: true, careers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT() {
  try {
    const careers = resetCareers();
    invalidateCareerCache();
    return NextResponse.json({ success: true, careers });
  } catch (error) {
    return handleApiError(error);
  }
}
