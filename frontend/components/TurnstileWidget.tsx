"use client";

import { useEffect, useId, useRef, useState } from "react";


type TurnstileVariant = "visible" | "invisible";
type TurnstileSize = "normal" | "compact" | "flexible";

type TurnstileWidgetProps = {
  action: string;
  variant?: TurnstileVariant;
  size?: TurnstileSize;
  className?: string;
  label?: string;
  resetKey?: number;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  theme: "dark" | "light" | "auto";
  size: TurnstileSize;
  appearance?: "always" | "execute" | "interaction-only";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __nenezTurnstileLoading?: Promise<void>;
  }
}

function siteKeyForVariant(variant: TurnstileVariant): string {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_TURNSTILE_IN_DEVELOPMENT !== "true"
  ) {
    return "";
  }

  if (variant === "invisible") {
    return (
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY_INVISIBLE ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY_INVISIBLE ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
      ""
    ).trim();
  }

  return (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY_VISIBLE ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY_VISIBLE ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    ""
  ).trim();
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__nenezTurnstileLoading) return window.__nenezTurnstileLoading;

  window.__nenezTurnstileLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-nenez-turnstile="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("TURNSTILE_SCRIPT_ERROR")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.nenezTurnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TURNSTILE_SCRIPT_ERROR"));
    document.head.appendChild(script);
  });

  return window.__nenezTurnstileLoading;
}

export function hasTurnstileSiteKey(variant: TurnstileVariant = "visible"): boolean {
  return Boolean(siteKeyForVariant(variant));
}

export default function TurnstileWidget({
  action,
  variant = "visible",
  size = "flexible",
  className = "",
  label = "Verificacion segura",
  resetKey = 0,
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const siteKey = siteKeyForVariant(variant);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  }, [onError, onExpire, onVerify]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    setVerified(false);
    setReady(false);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "dark",
          size,
          appearance: variant === "invisible" ? "interaction-only" : "always",
          callback: (token) => {
            setVerified(true);
            onVerifyRef.current(token);
          },
          "expired-callback": () => {
            setVerified(false);
            onExpireRef.current?.();
          },
          "error-callback": () => {
            setVerified(false);
            onErrorRef.current?.();
          },
        });
        setReady(true);
      })
      .catch(() => {
        setVerified(false);
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, resetKey, siteKey, size, variant]);

  if (!siteKey) return null;

  if (variant === "invisible") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        id={`turnstile-${reactId}`}
        ref={containerRef}
      />
    );
  }

  return (
    <div className={`rounded-2xl border px-3 py-3 transition ${
      verified
        ? "border-[#C8FF00]/35 bg-[#C8FF00]/[0.08] shadow-[0_0_26px_rgba(200,255,0,0.08)]"
        : "border-white/10 bg-black/35"
    } ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </span>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-[#C8FF00]">
            listo
          </span>
        )}
      </div>
      <div className="min-h-[65px] overflow-hidden rounded-xl" ref={containerRef}>
        {!ready && <div className="h-[65px] animate-pulse rounded-xl bg-white/[0.04]" />}
      </div>
    </div>
  );
}
