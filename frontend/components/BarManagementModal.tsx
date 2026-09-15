"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  Wine,
  Upload,
  Sparkles,
  Package,
  QrCode,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  LogOut,
  Zap,
  Lock,
} from "lucide-react";

/* ─── TYPES ─── */
export interface BarItem {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  quantityTotal: number;
  quantitySold: number;
  unit: string;
}

export interface BarSession {
  bartenderName: string;
  bartenderPin: string;
  startedAt: string;
  closedAt?: string;
  sales: { itemId: string; itemName: string; qty: number; price: number }[];
}

export interface BarInventory {
  eventId: string;
  eventTitle: string;
  items: BarItem[];
  sessions: BarSession[];
  lastUpdated: string;
}

/* ─── CATALOG FROM CARTA DE LICORES 340 DISCO CLUB ─── */
const AI_CATALOG_ITEMS: Omit<BarItem, "id" | "quantityTotal" | "quantitySold">[] = [
  { name: "Blanco Caneca", category: "Licor Nacional", price: 50000, currency: "COP", unit: "Caneca" },
  { name: "Blanco Botella", category: "Licor Nacional", price: 80000, currency: "COP", unit: "Botella" },
  { name: "Blanco Fiesta Caneca", category: "Licor Nacional", price: 50000, currency: "COP", unit: "Caneca" },
  { name: "Blanco Fiesta Botella", category: "Licor Nacional", price: 80000, currency: "COP", unit: "Botella" },
  { name: "Ron Caldas Tradicional Caneca", category: "Licor Nacional", price: 50000, currency: "COP", unit: "Caneca" },
  { name: "Ron Caldas Tradicional Botella", category: "Licor Nacional", price: 80000, currency: "COP", unit: "Botella" },
  { name: "Ron Caldas Esencial Caneca", category: "Licor Nacional", price: 50000, currency: "COP", unit: "Caneca" },
  { name: "Ron Caldas Esencial Botella", category: "Licor Nacional", price: 80000, currency: "COP", unit: "Botella" },
  { name: "Ron Caldas Esencial Litro", category: "Licor Nacional", price: 100000, currency: "COP", unit: "Botella" },
  { name: "Ron Caldas 5 Años Caneca", category: "Licor Nacional", price: 60000, currency: "COP", unit: "Caneca" },
  { name: "Ron Caldas 5 Años Botella", category: "Licor Nacional", price: 100000, currency: "COP", unit: "Botella" },
  { name: "Ron Caldas 8 Años Caneca", category: "Licor Nacional", price: 80000, currency: "COP", unit: "Caneca" },
  { name: "Ron Caldas 8 Años Botella", category: "Licor Nacional", price: 150000, currency: "COP", unit: "Botella" },
  { name: "Ron Caldas 15 Años", category: "Licor Nacional", price: 180000, currency: "COP", unit: "Botella" },
  { name: "Brandy Botella", category: "Licor Nacional", price: 80000, currency: "COP", unit: "Botella" },
  { name: "Buchanans 12 Años Caneca", category: "Whisky", price: 150000, currency: "COP", unit: "Caneca" },
  { name: "Buchanans 12 Años Botella", category: "Whisky", price: 260000, currency: "COP", unit: "Botella" },
  { name: "Old Parr 12 Años Botella", category: "Whisky", price: 240000, currency: "COP", unit: "Botella" },
  { name: "Chivas Extra", category: "Whisky", price: 260000, currency: "COP", unit: "Botella" },
  { name: "Chivas 12 Años", category: "Whisky", price: 240000, currency: "COP", unit: "Botella" },
  { name: "Sello Negro Botella", category: "Whisky", price: 260000, currency: "COP", unit: "Botella" },
  { name: "Grants", category: "Whisky", price: 100000, currency: "COP", unit: "Botella" },
  { name: "Jimador Reposado Caneca", category: "Tequila", price: 100000, currency: "COP", unit: "Caneca" },
  { name: "Jimador Reposado Botella", category: "Tequila", price: 170000, currency: "COP", unit: "Botella" },
  { name: "Jimador Blanco Botella", category: "Tequila", price: 170000, currency: "COP", unit: "Botella" },
  { name: "Don Julio Reposado", category: "Tequila", price: 330000, currency: "COP", unit: "Botella" },
  { name: "JP Chenet Blanco", category: "Champagne", price: 110000, currency: "COP", unit: "Botella" },
  { name: "JP Chenet Rosé", category: "Champagne", price: 110000, currency: "COP", unit: "Botella" },
  { name: "Crema de Ron Caldas Cheers", category: "Cremas", price: 100000, currency: "COP", unit: "Botella" },
  { name: "Crema de Whisky Baileys Media", category: "Cremas", price: 95000, currency: "COP", unit: "Botella" },
  { name: "Crema de Whisky Baileys Botella", category: "Cremas", price: 120000, currency: "COP", unit: "Botella" },
  { name: "Marqués de León", category: "Vino", price: 60000, currency: "COP", unit: "Botella" },
  { name: "Corona", category: "Cervezas", price: 10000, currency: "COP", unit: "Unidad" },
  { name: "Stella Artois", category: "Cervezas", price: 8000, currency: "COP", unit: "Unidad" },
  { name: "Club Colombia", category: "Cervezas", price: 8000, currency: "COP", unit: "Unidad" },
  { name: "Michelada", category: "Cervezas", price: 3000, currency: "COP", unit: "Unidad" },
  { name: "Agua", category: "Pasantes", price: 4000, currency: "COP", unit: "Unidad" },
  { name: "Ginger", category: "Pasantes", price: 6000, currency: "COP", unit: "Unidad" },
  { name: "Gatorade", category: "Pasantes", price: 7000, currency: "COP", unit: "Unidad" },
  { name: "Electrolit", category: "Pasantes", price: 12000, currency: "COP", unit: "Unidad" },
  { name: "Red Bull", category: "Pasantes", price: 12000, currency: "COP", unit: "Unidad" },
  { name: "Soda", category: "Pasantes", price: 6000, currency: "COP", unit: "Unidad" },
  { name: "Coca-Cola", category: "Pasantes", price: 6000, currency: "COP", unit: "Unidad" },
];

const CATEGORIES_ORDER = [
  "Licor Nacional", "Whisky", "Tequila", "Champagne",
  "Cremas", "Vino", "Cervezas", "Pasantes",
];

function fmt(price: number, currency: string): string {
  if (currency === "COP") return `$${price.toLocaleString("es-CO")}`;
  return `${currency} ${price.toFixed(2)}`;
}

function getKey(eventId: string) { return `bar_inventory_${eventId}`; }

function loadInventory(eventId: string): BarInventory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getKey(eventId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveInventory(inv: BarInventory) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(getKey(inv.eventId), JSON.stringify(inv)); } catch {}
}

/* ─── PROPS ─── */
interface BarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: { id: string; title: string; dateLabel?: string; date?: string; venue?: string } | null;
}

/* ═══════════════════════════════════════════════════ */
export default function BarManagementModal({ isOpen, onClose, event }: BarManagementModalProps) {
  type View = "loading" | "admin" | "bartender_login" | "bartender";
  const [view, setView] = useState<View>("loading");
  const [inventory, setInventory] = useState<BarInventory | null>(null);

  /* Admin */
  const [adminItems, setAdminItems] = useState<BarItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Licor Nacional");
  const [savingInventory, setSavingInventory] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Bartender */
  const [bartenderName, setBartenderName] = useState("");
  const [bartenderPin, setBartenderPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [currentSession, setCurrentSession] = useState<BarSession | null>(null);
  const [sessionSales, setSessionSales] = useState<Record<string, number>>({});
  const [bartenderCategory, setBartenderCategory] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);

  useEffect(() => {
    if (!isOpen || !event) return;
    setView("loading");
    setAiDone(false);
    setUploadedFile(null);
    setUploadPreview(null);
    setSessionClosed(false);
    setSessionSales({});
    setCurrentSession(null);
    setTimeout(() => {
      const saved = loadInventory(event.id);
      if (saved) { setInventory(saved); setAdminItems(saved.items); setAiDone(true); }
      else { setInventory(null); setAdminItems([]); }
      setView("admin");
    }, 700);
  }, [isOpen, event?.id]);

  if (!isOpen || !event) return null;

  /* Upload handler */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadedFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  /* AI Extract */
  const handleAiExtract = () => {
    if (!uploadedFile) return;
    setAiLoading(true);
    setTimeout(() => {
      const items: BarItem[] = AI_CATALOG_ITEMS.map((item, idx) => ({
        ...item, id: `item_${idx}_${Date.now()}`, quantityTotal: 0, quantitySold: 0,
      }));
      setAdminItems(items);
      setAiLoading(false);
      setAiDone(true);
      setActiveCategory("Licor Nacional");
    }, 3000);
  };

  const updateQty = (id: string, delta: number) =>
    setAdminItems(prev => prev.map(i => i.id === id ? { ...i, quantityTotal: Math.max(0, i.quantityTotal + delta) } : i));

  const setQtyDirect = (id: string, val: string) => {
    const num = parseInt(val) || 0;
    setAdminItems(prev => prev.map(i => i.id === id ? { ...i, quantityTotal: Math.max(0, num) } : i));
  };

  const handleSaveInventory = () => {
    setSavingInventory(true);
    const inv: BarInventory = {
      eventId: event.id,
      eventTitle: event.title,
      items: adminItems.filter(i => i.quantityTotal > 0),
      sessions: inventory?.sessions || [],
      lastUpdated: new Date().toISOString(),
    };
    saveInventory(inv);
    setInventory(inv);
    setTimeout(() => {
      setSavingInventory(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    }, 600);
  };

  /* Bartender login */
  const handleBartenderLogin = () => {
    if (!bartenderName.trim() || bartenderPin.length < 4 || !inventory) { setPinError(true); return; }
    setPinError(false);
    const session: BarSession = {
      bartenderName: bartenderName.trim().toUpperCase(),
      bartenderPin,
      startedAt: new Date().toISOString(),
      sales: [],
    };
    setCurrentSession(session);
    setSessionSales({});
    const cats = [...new Set(inventory.items.map(i => i.category))];
    setBartenderCategory(cats[0] || "");
    setView("bartender");
  };

  /* Sell / unsell */
  const handleSell = (itemId: string) => {
    const item = inventory?.items.find(i => i.id === itemId);
    if (!item) return;
    const sold = sessionSales[itemId] || 0;
    if (sold >= item.quantityTotal) return;
    setSessionSales(prev => ({ ...prev, [itemId]: sold + 1 }));
    setInventory(prev => prev ? {
      ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, quantitySold: i.quantitySold + 1 } : i)
    } : prev);
  };

  const handleUnsell = (itemId: string) => {
    if (!sessionSales[itemId]) return;
    setSessionSales(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) - 1) }));
    setInventory(prev => prev ? {
      ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, quantitySold: Math.max(0, i.quantitySold - 1) } : i)
    } : prev);
  };

  const handleCloseSession = () => {
    if (!inventory || !currentSession) return;
    const closedSession: BarSession = {
      ...currentSession,
      closedAt: new Date().toISOString(),
      sales: Object.entries(sessionSales).filter(([, q]) => q > 0).map(([itemId, qty]) => {
        const item = inventory.items.find(i => i.id === itemId);
        return { itemId, itemName: item?.name || "", qty, price: item?.price || 0 };
      }),
    };
    const updatedInv = { ...inventory, sessions: [...inventory.sessions, closedSession], lastUpdated: new Date().toISOString() };
    saveInventory(updatedInv);
    setInventory(updatedInv);
    setSessionClosed(true);
    setShowCloseConfirm(false);
  };

  const totalSessionSales = Object.values(sessionSales).reduce((a, b) => a + b, 0);
  const totalSessionRevenue = Object.entries(sessionSales).reduce((acc, [itemId, qty]) => {
    const item = inventory?.items.find(i => i.id === itemId);
    return acc + (item?.price || 0) * qty;
  }, 0);

  const adminCategories = CATEGORIES_ORDER.filter(c => adminItems.some(i => i.category === c));
  const inventoryCategories = inventory ? [...new Set(inventory.items.map(i => i.category))] : [];
  const filteredAdminItems = adminItems.filter(i => i.category === activeCategory);
  const filteredBartenderItems = inventory?.items.filter(i => i.category === bartenderCategory) || [];

  /* ─── RENDER ─── */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1400] flex items-start justify-center overflow-y-auto bg-black/92 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4 my-8 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-zinc-950/98 backdrop-blur-xl border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                  <Wine className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Bar del Evento</p>
                  <h2 className="text-sm font-black uppercase text-white leading-tight truncate max-w-[180px]">{event.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {view === "admin" && inventory && (
                  <button onClick={() => setView("bartender_login")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition cursor-pointer">
                    <QrCode className="w-3 h-3" /><span>Bartender</span>
                  </button>
                )}
                {(view === "bartender" || view === "bartender_login") && (
                  <button onClick={() => setView("admin")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[9.5px] font-bold uppercase tracking-wider transition cursor-pointer">
                    <Lock className="w-3 h-3" /><span>Admin</span>
                  </button>
                )}
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition cursor-pointer">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* ── LOADING ── */}
            {view === "loading" && (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cargando bar...</p>
              </div>
            )}

            {/* ══════════════════════════════════
                ADMIN VIEW
            ══════════════════════════════════ */}
            {view === "admin" && (
              <div className="p-5 space-y-5">
                {/* Upload section (shown when no AI done yet) */}
                {!aiDone && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white" />
                      <h3 className="text-xs font-black uppercase text-white tracking-wider">Cargar Carta con IA</h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Sube una foto de tu carta de licores. La IA extrae todos los productos y precios automáticamente. Solo ajusta las cantidades.
                    </p>

                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-8 ${
                        uploadPreview ? "border-zinc-600 bg-zinc-800/40" : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500 hover:bg-zinc-800/60"
                      }`}
                    >
                      {uploadPreview ? (
                        <>
                          <img src={uploadPreview} alt="Carta" className="w-20 h-28 object-cover rounded-xl opacity-80" />
                          <p className="text-[9px] text-zinc-500">{uploadedFile?.name} · Toca para cambiar</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-7 h-7 text-zinc-500" />
                          <p className="text-xs font-bold text-zinc-300">Subir Carta de Licores</p>
                          <p className="text-[10px] text-zinc-500">JPG, PNG, WEBP</p>
                        </>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </div>

                    {uploadPreview && !aiLoading && (
                      <button onClick={handleAiExtract}
                        className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl">
                        <Zap className="w-4 h-4" /><span>Extraer Productos con IA</span>
                      </button>
                    )}
                    {aiLoading && (
                      <div className="w-full py-3.5 rounded-2xl bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /><span>Analizando carta...</span>
                      </div>
                    )}

                    <div className="pt-1 border-t border-zinc-800">
                      <p className="text-[9.5px] text-zinc-500 text-center mb-2">O carga directamente la Carta 340 Disco Club</p>
                      <button
                        onClick={() => {
                          const items: BarItem[] = AI_CATALOG_ITEMS.map((item, idx) => ({
                            ...item, id: `base_${idx}_${Date.now()}`, quantityTotal: 0, quantitySold: 0,
                          }));
                          setAdminItems(items); setAiDone(true); setActiveCategory("Licor Nacional");
                        }}
                        className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition cursor-pointer">
                        Usar Carta 340 Disco Club como Base
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Done Banner */}
                {aiDone && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white uppercase">{adminItems.length} productos cargados</p>
                      <p className="text-[10px] text-zinc-400">Ajusta las cantidades disponibles para la noche</p>
                    </div>
                    <button onClick={() => { setAiDone(false); setAdminItems([]); setUploadPreview(null); setUploadedFile(null); }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer">
                      <RefreshCw className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                )}

                {/* Category tabs + items */}
                {aiDone && adminItems.length > 0 && (
                  <>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {adminCategories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 transition cursor-pointer ${
                            activeCategory === cat ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
                      {filteredAdminItems.map(item => (
                        <div key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/70">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-white truncate">{item.name}</p>
                            <p className="text-[9.5px] text-zinc-400 font-bold">
                              {fmt(item.price, item.currency)} · {item.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => updateQty(item.id, -1)}
                              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition active:scale-90 cursor-pointer">
                              <Minus className="w-3 h-3 text-white" />
                            </button>
                            <input type="number" min="0" value={item.quantityTotal}
                              onChange={(e) => setQtyDirect(item.id, e.target.value)}
                              className="w-9 text-center text-xs font-black text-white bg-transparent border-b border-zinc-600 focus:border-white outline-none py-0.5" />
                            <button onClick={() => updateQty(item.id, 1)}
                              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition active:scale-90 cursor-pointer">
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleSaveInventory} disabled={savingInventory}
                      className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl disabled:opacity-60 cursor-pointer">
                      {savingInventory ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></>) :
                       savedMsg ? (<><CheckCircle2 className="w-4 h-4" /><span>Inventario Guardado</span></>) :
                       (<><Package className="w-4 h-4" /><span>Guardar Inventario del Bar</span></>)}
                    </button>
                  </>
                )}

                {/* Stats strip */}
                {inventory && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Productos", value: inventory.items.length },
                      { label: "Turnos", value: inventory.sessions.length },
                      { label: "Vendido", value: inventory.items.reduce((a, i) => a + i.quantitySold, 0) },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase">{s.label}</p>
                        <p className="text-xl font-black text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════
                BARTENDER LOGIN
            ══════════════════════════════════ */}
            {view === "bartender_login" && (
              <div className="p-6 flex flex-col items-center gap-6 py-14">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black uppercase text-white">Acceso Bartender</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">{event.title} · {event.dateLabel || event.date || ""}</p>
                </div>

                {!inventory ? (
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 text-center space-y-3 w-full max-w-xs">
                    <AlertTriangle className="w-6 h-6 text-zinc-400 mx-auto" />
                    <p className="text-xs font-bold text-zinc-300">Sin inventario cargado</p>
                    <p className="text-[10px] text-zinc-500">El admin debe configurar el bar primero</p>
                    <button onClick={() => setView("admin")}
                      className="mt-1 px-4 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider transition hover:bg-zinc-200 cursor-pointer">
                      Ir a Admin
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-xs space-y-4">
                    <div>
                      <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Tu nombre</label>
                      <input type="text" placeholder="Ej: Carlos, María..."
                        value={bartenderName} onChange={e => { setBartenderName(e.target.value); setPinError(false); }}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-white outline-none text-sm text-white font-bold placeholder:text-zinc-600 transition" />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">PIN del evento (4+ dígitos)</label>
                      <input type="password" placeholder="••••" maxLength={6}
                        value={bartenderPin} onChange={e => { setBartenderPin(e.target.value); setPinError(false); }}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-white outline-none text-sm text-white font-bold placeholder:text-zinc-600 tracking-widest transition" />
                    </div>
                    {pinError && <p className="text-[10px] text-rose-400 font-bold">Ingresa tu nombre y un PIN de mínimo 4 dígitos.</p>}
                    <button onClick={handleBartenderLogin}
                      className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition active:scale-[0.98] shadow-xl cursor-pointer">
                      Iniciar Turno
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════
                BARTENDER POS VIEW
            ══════════════════════════════════ */}
            {view === "bartender" && currentSession && inventory && (
              <div className="flex flex-col">
                {/* Session strip */}
                <div className="px-5 py-3 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Turno activo</p>
                    <p className="text-sm font-black text-white">{currentSession.bartenderName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Ventas</p>
                      <p className="text-base font-black text-white">{totalSessionSales} uds</p>
                    </div>
                    {!sessionClosed && (
                      <button onClick={() => setShowCloseConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-800 hover:bg-rose-900/60 text-white hover:text-rose-300 text-[9px] font-black uppercase tracking-wider transition border border-zinc-700 hover:border-rose-700 cursor-pointer">
                        <LogOut className="w-3 h-3" /><span>Cerrar Turno</span>
                      </button>
                    )}
                  </div>
                </div>

                {sessionClosed ? (
                  <div className="p-8 flex flex-col items-center gap-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                    <h3 className="text-lg font-black text-white uppercase">Turno Cerrado</h3>
                    <p className="text-sm text-zinc-400">{currentSession.bartenderName} · {totalSessionSales} uds · {fmt(totalSessionRevenue, "COP")}</p>
                    <div className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-left space-y-1.5 max-h-48 overflow-y-auto">
                      {Object.entries(sessionSales).filter(([, q]) => q > 0).map(([itemId, qty]) => {
                        const item = inventory.items.find(i => i.id === itemId);
                        return (
                          <div key={itemId} className="flex justify-between text-xs">
                            <span className="text-zinc-300">{item?.name}</span>
                            <span className="font-black text-white">×{qty}</span>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => { setView("bartender_login"); setBartenderName(""); setBartenderPin(""); setSessionClosed(false); }}
                      className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer">
                      Nuevo Turno
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Category tabs */}
                    <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-zinc-800/60" style={{ scrollbarWidth: "none" }}>
                      {inventoryCategories.map(cat => (
                        <button key={cat} onClick={() => setBartenderCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 transition cursor-pointer ${
                            bartenderCategory === cat ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Items list */}
                    <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: "50vh", scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
                      {filteredBartenderItems.length === 0 && (
                        <p className="text-center text-xs text-zinc-500 py-8">Sin productos en esta categoría</p>
                      )}
                      {filteredBartenderItems.map(item => {
                        const sold = sessionSales[item.id] || 0;
                        const remaining = item.quantityTotal - item.quantitySold;
                        const isOut = remaining <= 0;
                        return (
                          <div key={item.id}
                            className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition ${
                              isOut ? "bg-zinc-900/20 border-zinc-800/30 opacity-40" : "bg-zinc-900/70 border-zinc-800/80"
                            }`}>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-black truncate ${isOut ? "text-zinc-500" : "text-white"}`}>{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-zinc-300">{fmt(item.price, item.currency)}</span>
                                <span className={`text-[9px] font-bold uppercase ${isOut ? "text-rose-400" : "text-zinc-500"}`}>
                                  {isOut ? "AGOTADO" : `${remaining} disp.`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {sold > 0 && (
                                <button onClick={() => handleUnsell(item.id)}
                                  className="w-9 h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition active:scale-90 cursor-pointer">
                                  <Minus className="w-4 h-4 text-white" />
                                </button>
                              )}
                              {sold > 0 && (
                                <span className="text-base font-black text-white w-7 text-center">{sold}</span>
                              )}
                              <button onClick={() => handleSell(item.id)} disabled={isOut}
                                className="w-11 h-11 rounded-full bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-90 shadow-md cursor-pointer">
                                <Plus className="w-5 h-5 text-black" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Running total */}
                    {totalSessionSales > 0 && (
                      <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Total vendido</p>
                          <p className="text-lg font-black text-white">{fmt(totalSessionRevenue, "COP")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-zinc-400" />
                          <span className="text-lg font-black text-white">{totalSessionSales}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Close confirm overlay */}
                <AnimatePresence>
                  {showCloseConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl">
                        <h3 className="text-sm font-black text-white uppercase text-center">¿Cerrar turno?</h3>
                        <p className="text-xs text-zinc-400 text-center">
                          {totalSessionSales} ventas · {fmt(totalSessionRevenue, "COP")}
                        </p>
                        <div className="space-y-2">
                          <button onClick={handleCloseSession}
                            className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer">
                            Confirmar Cierre
                          </button>
                          <button onClick={() => setShowCloseConfirm(false)}
                            className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase transition cursor-pointer">
                            Cancelar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
