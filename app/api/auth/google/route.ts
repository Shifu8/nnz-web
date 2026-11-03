import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildGoogleAuthorizationUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    // Read runtime configuration so a browser bundle cannot keep an old client ID.
    const environment = process.env;
    const url = buildGoogleAuthorizationUrl({
      clientId: environment.GOOGLE_CLIENT_ID || environment.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirectUri: environment.GOOGLE_REDIRECT_URI,
      origin: new URL(request.url).origin,
      nonce: randomUUID(),
    });
    return NextResponse.json({ url }, { headers });
  } catch (error) {
    console.error("Google sign-in configuration:", error instanceof Error ? error.message : "Invalid configuration");
    return NextResponse.json({ error: "El acceso con Google no está disponible por el momento. Inténtalo más tarde." }, { status: 503, headers });
  }
}
