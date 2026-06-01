export type GiveawayPhase = "countdown" | "open" | "drawing" | "closed";

export type GiveawaySchedule = {
  serverTime: string;
  openAt: string;
  closeAt: string;
  phase: GiveawayPhase;
  msUntilOpen: number;
  msUntilClose: number;
  msUntilWinnersEnd: number;
  nextOpenAt: string | null;
  msUntilNextOpen: number;
};

const WINNERS_DURATION_MS = 60_000; // 1 min
const PROMO_DURATION_MS = 60_000; // 1 min

function ecuadorDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

function toUtcFromEcuador(parts: ReturnType<typeof ecuadorDateParts>, hour: number, minute: number) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour + 5, minute, 0));
}

let frozenSchedule: GiveawaySchedule | null = null;
let nextOpenAtDate: Date | null = null;

export function getGiveawaySchedule(now = new Date()): GiveawaySchedule {
  const isDemo = process.env.NEXT_PUBLIC_PAYPHONE_DEMO_MODE === "true";
  const drawingWindowMs = isDemo ? 5 * 60_000 : 15 * 60_000;

  // Initialize nextOpenAtDate for demo if not set
  if (isDemo && !nextOpenAtDate) {
    nextOpenAtDate = new Date(Date.now() + PROMO_DURATION_MS);
  }
  // Refresh if already expired
  if (nextOpenAtDate && nextOpenAtDate.getTime() <= Date.now()) {
    nextOpenAtDate = new Date(Date.now() + PROMO_DURATION_MS);
  }

  // In demo mode, lock the schedule on first call so it doesn't slide
  if (frozenSchedule) {
    const openAt = new Date(frozenSchedule.openAt);
    const closeAt = new Date(frozenSchedule.closeAt);
    const winnersEndAt = new Date(closeAt.getTime() + drawingWindowMs + WINNERS_DURATION_MS);

    let phase: GiveawayPhase = "countdown";
    if (now >= closeAt) phase = "drawing";
    if (now >= new Date(closeAt.getTime() + drawingWindowMs)) phase = "closed";
    if (now >= openAt && now < closeAt) phase = "open";

    const nxt = nextOpenAtDate && nextOpenAtDate.getTime() > now.getTime() ? nextOpenAtDate : null;

    // Auto-advance: winners expired → set nextOpenAtDate and reset
    if (phase === "closed" && now >= winnersEndAt) {
      frozenSchedule = null;
      if (isDemo) nextOpenAtDate = new Date(Date.now() + PROMO_DURATION_MS);
      return getGiveawaySchedule(now);
    }

    return {
      ...frozenSchedule,
      serverTime: now.toISOString(),
      phase,
      msUntilOpen: Math.max(0, openAt.getTime() - now.getTime()),
      msUntilClose: Math.max(0, closeAt.getTime() - now.getTime()),
      msUntilWinnersEnd: Math.max(0, winnersEndAt.getTime() - now.getTime()),
      nextOpenAt: nxt?.toISOString() ?? null,
      msUntilNextOpen: nxt ? Math.max(0, nxt.getTime() - now.getTime()) : 0,
    };
  }

  const ec = ecuadorDateParts(now);
  const openHour = Number(process.env.GIVEAWAY_OPEN_HOUR || 16);
  const openMinute = Number(process.env.GIVEAWAY_OPEN_MINUTE || 22);
  const durationMin = Number(process.env.GIVEAWAY_DURATION_MINUTES || 1);

  const openAt = isDemo
    ? new Date(now.getTime() + (frozenSchedule ? 0 : PROMO_DURATION_MS))
    : toUtcFromEcuador(ec, openHour, openMinute);
  const closeAt = new Date(openAt.getTime() + durationMin * 60_000);

  let phase: GiveawayPhase = "countdown";
  if (now >= closeAt) phase = "drawing";
  if (now >= new Date(closeAt.getTime() + drawingWindowMs)) phase = "closed";
  if (now >= openAt && now < closeAt) phase = "open";

  const winnersEndAt = new Date(closeAt.getTime() + drawingWindowMs + WINNERS_DURATION_MS);
  const nxt = nextOpenAtDate && nextOpenAtDate.getTime() > now.getTime() ? nextOpenAtDate : null;

  const schedule: GiveawaySchedule = {
    serverTime: now.toISOString(),
    openAt: openAt.toISOString(),
    closeAt: closeAt.toISOString(),
    phase,
    msUntilOpen: Math.max(0, openAt.getTime() - now.getTime()),
    msUntilClose: Math.max(0, closeAt.getTime() - now.getTime()),
    msUntilWinnersEnd: Math.max(0, winnersEndAt.getTime() - now.getTime()),
    nextOpenAt: nxt?.toISOString() ?? null,
    msUntilNextOpen: nxt ? Math.max(0, nxt.getTime() - now.getTime()) : 0,
  };

  if (isDemo) frozenSchedule = schedule;
  return schedule;
}

export function resetGiveawaySchedule() {
  const isDemo = process.env.NEXT_PUBLIC_PAYPHONE_DEMO_MODE === "true";
  frozenSchedule = null;
  if (isDemo) {
    nextOpenAtDate = new Date(Date.now() + PROMO_DURATION_MS);
  } else {
    nextOpenAtDate = null;
  }
}

export function clearNextOpenAt() {
  nextOpenAtDate = null;
}
