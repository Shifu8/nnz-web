import { NextRequest, NextResponse } from "next/server";
import { loadConfig, saveConfig } from "@/lib/homepage-config/store";
import type { HomepageConfig } from "@/lib/homepage-config/types";

function isAuthorized(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = Buffer.from("admin:nenez2026").toString("base64");
  return auth === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const config = loadConfig();
  return NextResponse.json({ success: true, config });
}

export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { config: HomepageConfig };
    if (!body.config) {
      return NextResponse.json({ success: false, error: "Missing config" }, { status: 400 });
    }
    saveConfig(body.config);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}
