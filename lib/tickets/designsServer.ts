import fs from "fs";
import path from "path";
import { TICKET_DESIGNS, TicketDesign } from "./designs";

function getWorkspaceRootDir(): string {
  let dir = process.cwd();
  if (path.basename(dir) === "frontend") {
    dir = path.dirname(dir);
  }
  let currentSearch = process.cwd();
  for (let i = 0; i < 3; i++) {
    if (fs.existsSync(path.join(currentSearch, "data"))) {
      dir = currentSearch;
      break;
    }
    currentSearch = path.dirname(currentSearch);
  }
  return dir;
}

function getDesignsDbFile(): string {
  return path.join(getWorkspaceRootDir(), "data", "ticket-designs.json");
}

export function loadAllCustomDesigns(): TicketDesign[] {
  const dbFile = getDesignsDbFile();
  let needSeed = false;
  
  if (!fs.existsSync(dbFile)) {
    needSeed = true;
  } else {
    try {
      const raw = fs.readFileSync(dbFile, "utf-8");
      const parsed = JSON.parse(raw) as TicketDesign[];
      if (parsed.length === 0) {
        needSeed = true;
      } else {
        return parsed;
      }
    } catch {
      needSeed = true;
    }
  }

  if (needSeed) {
    const seed: TicketDesign[] = [];
    Object.entries(TICKET_DESIGNS).forEach(([eventId, designs]) => {
      designs.forEach((d, idx) => {
        seed.push({
          id: `${eventId}-default-${idx}`,
          eventId,
          name: d.name,
          photo: d.photo,
          accentColor: d.accentColor,
          shadowColor: d.shadowColor,
          badge: d.badge,
        });
      });
    });
    saveAllCustomDesigns(seed);
    return seed;
  }
  return [];
}

export function saveAllCustomDesigns(designs: TicketDesign[]): void {
  const dbFile = getDesignsDbFile();
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify(designs, null, 2), "utf-8");
}

export function getEventDesignsServer(eventId: string): TicketDesign[] {
  const allCustom = loadAllCustomDesigns();
  const customForEvent = allCustom.filter((d) => d.eventId === eventId);
  if (customForEvent.length > 0) {
    return customForEvent;
  }
  return TICKET_DESIGNS[eventId] || TICKET_DESIGNS["trap-loud"];
}
