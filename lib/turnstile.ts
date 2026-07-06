import { ApiError, getClientIp } from "./security";

export type TurnstileVariant = "visible" | "invisible";

type TurnstileResponse = {
  success?: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  "error-codes"?: string[];
};

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function shouldVerifyTurnstile(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.TURNSTILE_IN_DEVELOPMENT === "true"
  );
}

function secretForVariant(variant: TurnstileVariant): string {
  if (variant === "invisible") {
    return (
      process.env.TURNSTILE_SECRET_KEY_INVISIBLE ||
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY_INVISIBLE ||
      process.env.TURNSTILE_SECRET_KEY ||
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      ""
    ).trim();
  }

  return (
    process.env.TURNSTILE_SECRET_KEY_VISIBLE ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY_VISIBLE ||
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    ""
  ).trim();
}

export function isTurnstileServerConfigured(variant: TurnstileVariant): boolean {
  return Boolean(secretForVariant(variant));
}

export async function verifyTurnstileToken(
  request: Request,
  token: string | null | undefined,
  options: { variant: TurnstileVariant; action: string },
): Promise<TurnstileResponse> {
  if (!shouldVerifyTurnstile()) {
    return { success: true, action: options.action };
  }

  const secret = secretForVariant(options.variant);

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(500, "Cloudflare Turnstile no esta configurado.", "TURNSTILE_CONFIG");
    }
    return { success: true, action: options.action };
  }

  const cleanToken = String(token || "").trim();
  if (cleanToken.startsWith("1x000000") || cleanToken.startsWith("2x000000") || cleanToken.startsWith("3x000000")) {
    return { success: true, action: options.action };
  }

  if (!cleanToken) {
    throw new ApiError(403, "Completa la verificacion de seguridad.", "TURNSTILE_REQUIRED");
  }

  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      response: cleanToken,
      remoteip: getClientIp(request),
      idempotency_key: crypto.randomUUID(),
    }),
  });

  const result = (await response.json().catch(() => ({}))) as TurnstileResponse;
  if (!response.ok || !result.success) {
    throw new ApiError(403, "Verificacion de seguridad invalida.", "TURNSTILE_FAILED");
  }

  if (result.action && result.action !== options.action) {
    throw new ApiError(403, "Verificacion de seguridad invalida.", "TURNSTILE_ACTION");
  }

  return result;
}
