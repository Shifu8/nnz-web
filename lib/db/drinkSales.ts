import "server-only";

import fs from "fs";
import path from "path";
import { loadAllEvents } from "@/lib/admin/events-store";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";

export interface DrinkSaleRecord {
  id: string;
  drinkId: string;
  drinkName: string;
  price: number;
  quantity: number;
  timestamp: string;
  bartender: string;
  eventId?: string;
}

export interface DrinkItemSummary {
  name: string;
  count: number;
  revenue: number;
  price: number;
  category: "Botellas" | "Cocteles Especiales";
  stock: number;
  initialStock: number;
}

export interface BartenderSummary {
  count: number;
  revenue: number;
}

export interface DrinkSalesSummary {
  totalCount: number;
  totalRevenue: number;
  cashierName: string;
  lastUpdated: string;
  items: Record<string, DrinkItemSummary>;
  transactions: DrinkSaleRecord[];
  bartenders: Record<string, BartenderSummary>;
}

const DATA_FILE = path.join(process.cwd(), "data", "drinks_sales.json");

const DEFAULT_DRINKS: Record<string, { name: string; price: number; category: "Botellas" | "Cocteles Especiales"; stock: number }> = {
  "mojito-eleva": { name: "Mojito Eleva", price: 2, category: "Cocteles Especiales", stock: 200 },
  "cuba-eleva": { name: "Cuba Elevá", price: 15, category: "Cocteles Especiales", stock: 100 },
  "gran-malo": { name: "Gran Malo Tequila (750ml)", price: 35, category: "Botellas", stock: 50 },
  "jagger": { name: "Jägermeister (750ml)", price: 45, category: "Botellas", stock: 40 },
  "black-label": { name: "Black Label Whisky (750ml)", price: 75, category: "Botellas", stock: 30 },
  "absolut": { name: "Absolut Vodka (750ml)", price: 40, category: "Botellas", stock: 50 },
  "don-julio": { name: "Don Julio Reposado (750ml)", price: 95, category: "Botellas", stock: 20 },
};

function getActiveEventDrinks() {
  try {
    const activeEventInfo = getActiveTicketEvent();
    const events = loadAllEvents();
    const event = events.find(e => e.id === activeEventInfo.sourceId || e.slug === activeEventInfo.slug);
    if (event && Array.isArray(event.drinks)) {
      return event.drinks;
    }
  } catch (err) {
    console.error("Error loading active event drinks:", err);
  }
  return [];
}

function getActiveEventDrinksMap(): Record<string, { name: string; price: number; category: "Botellas" | "Cocteles Especiales"; stock: number }> {
  const drinksMap: Record<string, { name: string; price: number; category: "Botellas" | "Cocteles Especiales"; stock: number }> = {};
  
  const eventDrinks = getActiveEventDrinks();
  for (const item of eventDrinks) {
    if (!item.id || !item.name) continue;
    const category = item.category === "Cocteles Especiales" || item.category === "Especiales" ? "Cocteles Especiales" : "Botellas";
    const price = Number(String(item.price || "0").replace(/[^0-9.]/g, '')) || 0;
    
    // Default stocks
    let defaultStock = category === "Cocteles Especiales" ? 100 : 50;
    if (item.id === "mojito-eleva") defaultStock = 200;
    else if (item.id === "cuba-eleva") defaultStock = 100;
    else if (item.id === "gran-malo") defaultStock = 50;
    else if (item.id === "jagger") defaultStock = 40;
    else if (item.id === "black-label") defaultStock = 30;
    else if (item.id === "absolut") defaultStock = 50;
    else if (item.id === "don-julio") defaultStock = 20;

    drinksMap[item.id] = {
      name: item.name,
      price,
      category,
      stock: defaultStock
    };
  }

  if (Object.keys(drinksMap).length === 0) {
    return DEFAULT_DRINKS;
  }
  return drinksMap;
}

function getInitialSummary(): DrinkSalesSummary {
  const items: Record<string, DrinkItemSummary> = {};
  const activeDrinks = getActiveEventDrinksMap();
  for (const [id, info] of Object.entries(activeDrinks)) {
    items[id] = {
      name: info.name,
      price: info.price,
      category: info.category,
      count: 0,
      revenue: 0,
      stock: info.stock,
      initialStock: info.stock,
    };
  }

  return {
    totalCount: 0,
    totalRevenue: 0,
    cashierName: "Viviana Calva",
    lastUpdated: new Date().toISOString(),
    items,
    transactions: [],
    bartenders: {
      "Viviana Calva": { count: 0, revenue: 0 },
      "Carlos Ruiz": { count: 0, revenue: 0 },
      "Mateo Gómez": { count: 0, revenue: 0 },
      "Sofía Vega": { count: 0, revenue: 0 },
    },
  };
}

export function getDrinkSalesSummary(): DrinkSalesSummary {
  if (!fs.existsSync(DATA_FILE)) {
    return getInitialSummary();
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    
    // Ensure all configured drinks exist in the loaded JSON
    const activeDrinks = getActiveEventDrinksMap();
    const items: Record<string, DrinkItemSummary> = {};
    for (const [id, info] of Object.entries(activeDrinks)) {
      items[id] = {
        name: info.name,
        price: info.price,
        category: info.category,
        count: 0,
        revenue: 0,
        stock: info.stock,
        initialStock: info.stock,
      };
    }

    if (data.items) {
      for (const [id, val] of Object.entries(data.items)) {
        if (items[id]) {
          items[id].count = Number((val as any).count || 0);
          items[id].revenue = Number((val as any).revenue || 0);
          // Load stock properties (fallback to default values if not defined)
          const drinkInfo = activeDrinks[id];
          items[id].stock = (val as any).stock !== undefined ? Number((val as any).stock) : drinkInfo.stock;
          items[id].initialStock = (val as any).initialStock !== undefined ? Number((val as any).initialStock) : drinkInfo.stock;
        }
      }
    }

    // Ensure bartender breakdown exists
    const bartenders = {
      "Viviana Calva": { count: 0, revenue: 0 },
      "Carlos Ruiz": { count: 0, revenue: 0 },
      "Mateo Gómez": { count: 0, revenue: 0 },
      "Sofía Vega": { count: 0, revenue: 0 },
    };
    if (data.bartenders) {
      for (const [name, val] of Object.entries(data.bartenders)) {
        if (bartenders[name as keyof typeof bartenders]) {
          bartenders[name as keyof typeof bartenders].count = Number((val as any).count || 0);
          bartenders[name as keyof typeof bartenders].revenue = Number((val as any).revenue || 0);
        }
      }
    }

    return {
      totalCount: Number(data.totalCount || 0),
      totalRevenue: Number(data.totalRevenue || 0),
      cashierName: data.cashierName || "Viviana Calva",
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      items,
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      bartenders,
    };
  } catch {
    return getInitialSummary();
  }
}

export function updateDrinkCashierName(cashierName: string): DrinkSalesSummary {
  const summary = getDrinkSalesSummary();
  summary.cashierName = cashierName.trim() || "Viviana Calva";
  summary.lastUpdated = new Date().toISOString();

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function adjustDrinkStock(drinkId: string, newStock: number): DrinkSalesSummary {
  const summary = getDrinkSalesSummary();
  const drinkInfo = DEFAULT_DRINKS[drinkId];
  if (!drinkInfo) {
    throw new Error("Bebida inválida");
  }

  if (!summary.items[drinkId]) {
    summary.items[drinkId] = {
      name: drinkInfo.name,
      price: drinkInfo.price,
      category: drinkInfo.category,
      count: 0,
      revenue: 0,
      stock: drinkInfo.stock,
      initialStock: drinkInfo.stock,
    };
  }

  summary.items[drinkId].stock = Math.max(0, newStock);
  if (newStock > summary.items[drinkId].initialStock) {
    summary.items[drinkId].initialStock = newStock;
  }
  summary.lastUpdated = new Date().toISOString();

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function recordDrinkSale(drinkId: string, quantity: number = 1, bartenderName?: string): DrinkSalesSummary {
  const summary = getDrinkSalesSummary();
  const drinkInfo = DEFAULT_DRINKS[drinkId];
  if (!drinkInfo) {
    throw new Error("Bebida inválida");
  }

  if (!summary.items[drinkId]) {
    summary.items[drinkId] = {
      name: drinkInfo.name,
      price: drinkInfo.price,
      category: drinkInfo.category,
      count: 0,
      revenue: 0,
      stock: drinkInfo.stock,
      initialStock: drinkInfo.stock,
    };
  }

  // Check Stock
  if (summary.items[drinkId].stock < quantity) {
    throw new Error("Sin stock suficiente de " + drinkInfo.name);
  }

  const price = drinkInfo.price;
  const now = new Date().toISOString();
  const activeBartender = bartenderName || summary.cashierName || "Viviana Calva";

  const newRecord: DrinkSaleRecord = {
    id: crypto.randomUUID(),
    drinkId,
    drinkName: drinkInfo.name,
    price,
    quantity,
    timestamp: now,
    bartender: activeBartender,
  };

  summary.items[drinkId].count += quantity;
  summary.items[drinkId].revenue += quantity * price;
  summary.items[drinkId].stock = Math.max(0, summary.items[drinkId].stock - quantity);

  summary.totalCount += quantity;
  summary.totalRevenue += quantity * price;
  summary.lastUpdated = now;
  summary.transactions = [newRecord, ...summary.transactions].slice(0, 2000);

  // Update bartender stats
  if (!summary.bartenders) {
    summary.bartenders = {
      "Viviana Calva": { count: 0, revenue: 0 },
      "Carlos Ruiz": { count: 0, revenue: 0 },
      "Mateo Gómez": { count: 0, revenue: 0 },
      "Sofía Vega": { count: 0, revenue: 0 },
    };
  }
  if (!summary.bartenders[activeBartender]) {
    summary.bartenders[activeBartender] = { count: 0, revenue: 0 };
  }
  summary.bartenders[activeBartender].count += quantity;
  summary.bartenders[activeBartender].revenue += quantity * price;

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function undoLastDrinkSale(bartenderFilter?: string): DrinkSalesSummary {
  const summary = getDrinkSalesSummary();
  if (summary.transactions.length === 0) return summary;

  let targetIdx = 0;
  if (bartenderFilter) {
    targetIdx = summary.transactions.findIndex(tx => tx.bartender === bartenderFilter);
    if (targetIdx === -1) return summary;
  }

  const lastTx = summary.transactions[targetIdx];
  summary.transactions.splice(targetIdx, 1);

  const { drinkId, price, quantity, bartender } = lastTx;

  if (summary.items[drinkId]) {
    summary.items[drinkId].count = Math.max(0, summary.items[drinkId].count - quantity);
    summary.items[drinkId].revenue = Math.max(0, summary.items[drinkId].revenue - (quantity * price));
    summary.items[drinkId].stock += quantity; // Re-add to stock!
  }

  // Update bartender stats
  if (bartender && summary.bartenders && summary.bartenders[bartender]) {
    summary.bartenders[bartender].count = Math.max(0, summary.bartenders[bartender].count - quantity);
    summary.bartenders[bartender].revenue = Math.max(0, summary.bartenders[bartender].revenue - (quantity * price));
  }

  summary.totalCount = Math.max(0, summary.totalCount - quantity);
  summary.totalRevenue = Math.max(0, summary.totalRevenue - (quantity * price));
  summary.lastUpdated = new Date().toISOString();

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

export function resetDrinkSales(): DrinkSalesSummary {
  const currentSummary = getDrinkSalesSummary();
  const initial = getInitialSummary();
  initial.cashierName = currentSummary.cashierName || "Viviana Calva";

  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  return initial;
}
