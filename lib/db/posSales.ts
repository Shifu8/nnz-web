import "server-only";

import fs from "fs";
import path from "path";

export interface PosSaleRecord {
  id: string;
  ticketType: "student" | "general";
  ticketName: string;
  price: number;
  timestamp: string;
  eventId?: string;
}

export interface PosSalesSummary {
  studentCount: number;
  studentRevenue: number;
  generalCount: number;
  generalRevenue: number;
  totalCount: number;
  totalRevenue: number;
  cashierName: string;
  lastUpdated: string;
  transactions: PosSaleRecord[];
}

const DATA_FILE = path.join(process.cwd(), "data", "pos_sales.json");

function getInitialSummary(): PosSalesSummary {
  return {
    studentCount: 0,
    studentRevenue: 0,
    generalCount: 0,
    generalRevenue: 0,
    totalCount: 0,
    totalRevenue: 0,
    cashierName: "Viviana Calva",
    lastUpdated: new Date().toISOString(),
    transactions: [],
  };
}

export function getPosSalesSummary(): PosSalesSummary {
  if (!fs.existsSync(DATA_FILE)) {
    return getInitialSummary();
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      studentCount: Number(data.studentCount || 0),
      studentRevenue: Number(data.studentRevenue || 0),
      generalCount: Number(data.generalCount || 0),
      generalRevenue: Number(data.generalRevenue || 0),
      totalCount: Number(data.totalCount || 0),
      totalRevenue: Number(data.totalRevenue || 0),
      cashierName: data.cashierName || "Viviana Calva",
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
    };
  } catch {
    return getInitialSummary();
  }
}

export function updateCashierName(cashierName: string): PosSalesSummary {
  const summary = getPosSalesSummary();
  summary.cashierName = cashierName.trim() || "Viviana Calva";
  summary.lastUpdated = new Date().toISOString();

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function recordPosSale(type: "student" | "general", quantity: number = 1): PosSalesSummary {
  const summary = getPosSalesSummary();
  const price = type === "student" ? 5 : 8;
  const ticketName = type === "student" ? "Entrada Carnet Universitario ($5)" : "Entrada General ($8)";

  const newRecords: PosSaleRecord[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < quantity; i++) {
    newRecords.push({
      id: crypto.randomUUID(),
      ticketType: type,
      ticketName,
      price,
      timestamp: now,
    });
  }

  if (type === "student") {
    summary.studentCount += quantity;
    summary.studentRevenue += quantity * price;
  } else {
    summary.generalCount += quantity;
    summary.generalRevenue += quantity * price;
  }

  summary.totalCount = summary.studentCount + summary.generalCount;
  summary.totalRevenue = summary.studentRevenue + summary.generalRevenue;
  summary.lastUpdated = now;
  summary.transactions = [...newRecords, ...summary.transactions].slice(0, 100);

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function undoLastPosSale(): PosSalesSummary {
  const summary = getPosSalesSummary();
  if (summary.transactions.length === 0) return summary;

  const lastTx = summary.transactions[0];
  summary.transactions = summary.transactions.slice(1);

  if (lastTx.ticketType === "student") {
    summary.studentCount = Math.max(0, summary.studentCount - 1);
    summary.studentRevenue = Math.max(0, summary.studentRevenue - 5);
  } else {
    summary.generalCount = Math.max(0, summary.generalCount - 1);
    summary.generalRevenue = Math.max(0, summary.generalRevenue - 8);
  }

  summary.totalCount = summary.studentCount + summary.generalCount;
  summary.totalRevenue = summary.studentRevenue + summary.generalRevenue;
  summary.lastUpdated = new Date().toISOString();

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function resetPosSales(): PosSalesSummary {
  const currentSummary = getPosSalesSummary();
  const initial = getInitialSummary();
  initial.cashierName = currentSummary.cashierName || "Viviana Calva";

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  return initial;
}
