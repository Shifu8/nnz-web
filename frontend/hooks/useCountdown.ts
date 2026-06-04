/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Hook reusable para countdowns reales de eventos.
 */

"use client";

import { useEffect, useMemo, useState } from "react";

export function useCountdown(target: string) {
  const targetTime = useMemo(() => new Date(target).getTime(), [target]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const distance = Math.max(targetTime - now, 0);

  return {
    days: String(Math.floor(distance / 86400000)).padStart(2, "0"),
    hours: String(Math.floor((distance % 86400000) / 3600000)).padStart(2, "0"),
    minutes: String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0"),
    seconds: String(Math.floor((distance % 60000) / 1000)).padStart(2, "0"),
    expired: distance === 0,
  };
}
