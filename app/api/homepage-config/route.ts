import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/homepage-config/store";

export async function GET() {
  const config = loadConfig();
  return NextResponse.json({ success: true, config });
}
