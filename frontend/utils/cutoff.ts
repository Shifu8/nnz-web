import type { Event } from "@/frontend/types/domain";

export interface SalesStatus {
  isClosed: boolean;
  isWarning: boolean;
  remainingMs: number;
  remainingLabel: string;
  cutoffTime: string;
}

export function getOnlineSalesStatus(event?: Event | null): SalesStatus {
  if (!event) {
    return {
      isClosed: false,
      isWarning: false,
      remainingMs: Infinity,
      remainingLabel: "",
      cutoffTime: "14:00",
    };
  }

  const cutoffTimeStr = event.onlineSalesCutoffTime || "14:00";
  const dateStr = event.startsAt
    ? event.startsAt.split("T")[0]
    : (event as any).date || "2026-08-15";

  const targetDate = new Date(
    `${dateStr}T${cutoffTimeStr.length === 5 ? cutoffTimeStr + ":00" : cutoffTimeStr}-05:00`
  );

  if (isNaN(targetDate.getTime())) {
    return {
      isClosed: false,
      isWarning: false,
      remainingMs: Infinity,
      remainingLabel: "",
      cutoffTime: cutoffTimeStr,
    };
  }

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  const isClosed = diffMs <= 0;
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const isWarning = !isClosed && diffMs <= THREE_HOURS_MS;

  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const remainingLabel = `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return {
    isClosed,
    isWarning,
    remainingMs: diffMs,
    remainingLabel,
    cutoffTime: cutoffTimeStr,
  };
}
