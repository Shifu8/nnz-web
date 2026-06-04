/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Hook reusable para countdowns reales de eventos.
 */

"use client";

import { useEffect, useMemo, useState } from "react";

export function useCountdown(target: string) {
  const targetTime = useMemo(() => new Date(target).getTime(), [target]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const initialTick = window.setTimeout(updateNow, 0);
    const interval = window.setInterval(updateNow, 1000);

    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, []);

  const distance = now === null || !Number.isFinite(targetTime) ? 0 : Math.max(targetTime - now, 0);

  return {
    days: String(Math.floor(distance / 86400000)).padStart(2, "0"),
    hours: String(Math.floor((distance % 86400000) / 3600000)).padStart(2, "0"),
    minutes: String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0"),
    seconds: String(Math.floor((distance % 60000) / 1000)).padStart(2, "0"),
    expired: now !== null && distance === 0,
  };
}
