"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RefreshCw,
  Undo2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Users,
  Download,
  Clock,
  User,
  Wine,
  GlassWater,
  Flame,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";

interface DrinksSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
}

interface DrinkSaleRecord {
  id: string;
  drinkId: string;
  drinkName: string;
  price: number;
  quantity: number;
  timestamp: string;
  bartender: string;
}

interface DrinkItemSummary {
  name: string;
  count: number;
  revenue: number;
  price: number;
  category: "Botellas" | "Cocteles Especiales";
  stock: number;
  initialStock: number;
}

interface DrinkSalesSummary {
  totalCount: number;
  totalRevenue: number;
  cashierName: string;
  lastUpdated: string;
  items: Record<string, DrinkItemSummary>;
  transactions: DrinkSaleRecord[];
  bartenders: Record<string, { count: number; revenue: number }>;
}

export default function DrinksSalesModal({
  isOpen,
  onClose,
  event,
}: DrinksSalesModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBartender, setActiveBartender] = useState("Viviana Calva");
  const [selectedLoginBartender, setSelectedLoginBartender] = useState("Viviana Calva");
  const [showReportDropdown, setShowReportDropdown] = useState(false);

  // Security confirmation for Reset
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Sales Stats & History
  const [summary, setSummary] = useState<DrinkSalesSummary>({
    totalCount: 0,
    totalRevenue: 0,
    cashierName: "Viviana Calva",
    lastUpdated: new Date().toISOString(),
    items: {},
    transactions: [],
    bartenders: {
      "Viviana Calva": { count: 0, revenue: 0 },
      "Carlos Ruiz": { count: 0, revenue: 0 },
      "Mateo Gómez": { count: 0, revenue: 0 },
    },
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Event details
  const eventTitle = event?.title || "DAWG NIGHT";
  const eventVenue = event?.venue || "Mónaco Nightclub";

  // Load stats from API on login or modal open
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/pos/drinks");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchSummary();
    }
  }, [isOpen, isAuthenticated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isValid = await validateBartenderPassword(selectedLoginBartender, password);
      if (!isValid) {
        setError("Contraseña incorrecta para " + selectedLoginBartender.split(" ")[0]);
        setLoading(false);
        return;
      }

      // Hitting staff login to set http-only session cookie
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "drinks" }),
      });

      if (!res.ok) {
        setError("Error al iniciar sesión de barra");
        setLoading(false);
        return;
      }

      setActiveBartender(selectedLoginBartender);
      setIsAuthenticated(true);
      fetchSummary();
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const validateBartenderPassword = async (target: string, pass: string): Promise<boolean> => {
    const p = pass.toLowerCase().trim();
    if (target === "Viviana Calva" && (p === "viviana" || p === "viviana123")) return true;
    if (target === "Carlos Ruiz" && (p === "carlos" || p === "carlos123")) return true;
    if (target === "Mateo Gómez" && (p === "mateo" || p === "mateo123")) return true;
    if (target === "Sofía Vega" && (p === "sofia" || p === "sofia123")) return true;
    
    // Check global/admin passwords
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass, role: "drinks" }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSale = async (drinkId: string) => {
    const drink = summary.items[drinkId];
    if (!drink) return;
    const { name: drinkName, price } = drink;

    const stockCount = drink.stock !== undefined ? drink.stock : 0;
    if (stockCount <= 0) {
      showToast("Sin stock disponible");
      return;
    }

    const newRecord: DrinkSaleRecord = {
      id: crypto.randomUUID(),
      drinkId,
      drinkName,
      price,
      quantity: 1,
      timestamp: new Date().toISOString(),
      bartender: activeBartender,
    };

    // Optimistic UI update
    setSummary((prev) => {
      const prevItem = prev.items[drinkId] || { name: drinkName, price, count: 0, revenue: 0, category: "Botellas", stock: 0, initialStock: 0 };
      const updatedItem = {
        ...prevItem,
        count: prevItem.count + 1,
        revenue: prevItem.revenue + price,
        stock: Math.max(0, prevItem.stock - 1),
      };

      const prevBartenders = prev.bartenders || {
        "Viviana Calva": { count: 0, revenue: 0 },
        "Carlos Ruiz": { count: 0, revenue: 0 },
        "Mateo Gómez": { count: 0, revenue: 0 }
      };
      const activeStats = prevBartenders[activeBartender] || { count: 0, revenue: 0 };
      const updatedBartenders = {
        ...prevBartenders,
        [activeBartender]: {
          count: activeStats.count + 1,
          revenue: activeStats.revenue + price,
        }
      };

      return {
        ...prev,
        totalCount: prev.totalCount + 1,
        totalRevenue: prev.totalRevenue + price,
        lastUpdated: new Date().toISOString(),
        items: {
          ...prev.items,
          [drinkId]: updatedItem,
        },
        bartenders: updatedBartenders,
        transactions: [newRecord, ...prev.transactions].slice(0, 50),
      };
    });

    showToast(`+1 ${drinkName} ($${price})`);

    try {
      const res = await fetch("/api/pos/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sale", drinkId, bartender: activeBartender }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
      }
    } catch {}
  };

  const handleUndo = async () => {
    const hasMyTx = summary.transactions.some((tx) => tx.bartender === activeBartender);
    if (!hasMyTx) return;

    try {
      const res = await fetch("/api/pos/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo", bartender: activeBartender }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        showToast("Tu última venta de barra fue revertida");
      }
    } catch {}
  };

  const handleOpenResetModal = () => {
    setResetPasswordInput("");
    setResetError("");
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      // Validate password via staff login API
      const authRes = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordInput, role: "drinks" }),
      });

      if (!authRes.ok) {
        setResetError("Contraseña de barra incorrecta");
        setResetLoading(false);
        return;
      }

      // Password valid, proceed to reset drinks sales
      const res = await fetch("/api/pos/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        setShowResetConfirmModal(false);
        setResetPasswordInput("");
        showToast("Caja de barra reiniciada a $0");
      }
    } catch {
      setResetError("Error conectando al servidor");
    } finally {
      setResetLoading(false);
    }
  };

  const exportToExcel = (targetBartender?: string) => {
    const nowStr = new Date().toLocaleString("es-EC");
    const label = targetBartender ? targetBartender.replace(/\s+/g, "_") : "Consolidado";
    const filename = `Cierre_Barra_${label}_${eventTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xls`;

    // Filter transactions and items for the target bartender
    const allTx = summary.transactions || [];
    const filteredTx = targetBartender 
      ? allTx.filter(tx => tx.bartender === targetBartender)
      : allTx;

    // Calculate item counts for the bartender
    const itemSummaries: Record<string, { name: string; price: number; count: number; revenue: number; category: string; stock: number; initialStock: number }> = {};
    
    // Initialize with default items
    for (const [id, item] of Object.entries(summary.items)) {
      itemSummaries[id] = {
        name: item.name,
        price: item.price,
        count: 0,
        revenue: 0,
        category: item.category,
        stock: item.stock,
        initialStock: item.initialStock
      };
    }

    // Accumulate for filtered transactions
    filteredTx.forEach(tx => {
      if (itemSummaries[tx.drinkId]) {
        itemSummaries[tx.drinkId].count += tx.quantity;
        itemSummaries[tx.drinkId].revenue += tx.quantity * tx.price;
      }
    });

    const itemsArray = Object.values(itemSummaries);
    const cocteles = itemsArray.filter(i => i.category === "Cocteles Especiales");
    const botellas = itemsArray.filter(i => i.category === "Botellas");

    const totalCount = filteredTx.reduce((acc, tx) => acc + tx.quantity, 0);
    const totalRevenue = filteredTx.reduce((acc, tx) => acc + (tx.quantity * tx.price), 0);

    const titleText = targetBartender 
      ? `NOWTICKETS — CIERRE DE CAJA INDIVIDUAL: ${targetBartender.toUpperCase()}`
      : `NOWTICKETS — REPORTE DE CIERRE DE CAJA DE BARRA (CONSOLIDADO)`;

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Cierre de Barra</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          .title { font-size: 16px; font-weight: bold; color: #ffffff; background-color: #070707; text-align: center; padding: 14px; }
          .label-col { font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px; }
          .val-col { border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f172a; }
          .category-header { background-color: #f59e0b; color: #ffffff; font-weight: bold; text-align: left; border: 1px solid #d97706; padding: 8px; }
          .kpi-header { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #1e293b; padding: 10px; }
          .item-row { background-color: #fffbeb; color: #b45309; font-weight: bold; }
          .total-row { background-color: #0f172a; color: #f59e0b; font-weight: bold; font-size: 14px; }
          .audit-header { background-color: #e2e8f0; color: #0f172a; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; padding: 8px; }
          .border-cell { border: 1px solid #e2e8f0; padding: 8px; }
          .center { text-align: center; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="6" style="font-size: 16px; font-weight: bold; color: #f59e0b; background-color: #070707; text-align: center; padding: 14px; border: 1px solid #000000;">
              ${titleText}
            </td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Evento:</td>
            <td colspan="5" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f172a;">${eventTitle}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Lugar / Ubicación:</td>
            <td colspan="5" style="border: 1px solid #cbd5e1; padding: 8px; color: #334155;">${eventVenue}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Bartender del Cierre:</td>
            <td colspan="5" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #b45309;">${targetBartender || "Todos (Consolidado)"}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Fecha de Exportación:</td>
            <td colspan="5" style="border: 1px solid #cbd5e1; padding: 8px; color: #334155;">${nowStr}</td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <!-- Resumen de Ventas de Barra -->
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center;">
            <td colspan="2" style="padding: 10px; border: 1px solid #334155;">CONCEPTO DE BEBIDA</td>
            <td style="padding: 10px; border: 1px solid #334155;">CANTIDAD VENDIDA</td>
            <td style="padding: 10px; border: 1px solid #334155;">PRECIO UNITARIO</td>
            <td style="padding: 10px; border: 1px solid #334155;">STOCK RESTANTE</td>
            <td style="padding: 10px; border: 1px solid #334155;">TOTAL RECAUDADO ($)</td>
          </tr>

          <!-- Especiales de la Noche -->
          <tr><td colspan="6" style="background-color: #fff7ed; color: #c2410c; font-weight: bold; padding: 6px; border: 1px solid #ffedd5;">COCTELES ESPECIALES DE LA NOCHE</td></tr>
          ${cocteles
            .map(
              (item) => `
            <tr>
              <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; color: #1e293b;">${item.name}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${item.count}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #475569;">$${item.price}.00</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #475569;">${item.stock} / ${item.initialStock}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #b45309;">$${item.revenue}.00</td>
            </tr>
          `
            )
            .join("")}

          <!-- Botellas -->
          <tr><td colspan="6" style="background-color: #fef3c7; color: #b45309; font-weight: bold; padding: 6px; border: 1px solid #fde68a;">BOTELLAS DE LICOR</td></tr>
          ${botellas
            .map(
              (item) => `
            <tr>
              <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; color: #1e293b;">${item.name}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${item.count}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #475569;">$${item.price}.00</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #475569;">${item.stock} / ${item.initialStock}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #b45309;">$${item.revenue}.00</td>
            </tr>
          `
            )
            .join("")}

          <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold;">
            <td colspan="2" style="border: 1px solid #334155; padding: 10px;">TOTAL CIERRE</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: center; font-size: 13px; color: #fbbf24;">${totalCount} uds.</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: right;">-</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: right; font-size: 15px; color: #fbbf24;">$${totalRevenue}.00</td>
          </tr>

          ${!targetBartender ? `
          <tr><td colspan="6"></td></tr>
          <tr><td colspan="6"></td></tr>

          <!-- Resumen por Bartender -->
          <tr><td colspan="6" style="background-color: #fffbeb; color: #b45309; font-weight: bold; padding: 6px; border: 1px solid #fde68a;">RESUMEN CONSOLIDADO POR BARTENDER</td></tr>
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center;">
            <td colspan="2" style="padding: 8px; border: 1px solid #334155;">BARTENDER</td>
            <td style="padding: 8px; border: 1px solid #334155;">BEBIDAS ENTREGADAS</td>
            <td style="padding: 8px; border: 1px solid #334155;">-</td>
            <td colspan="2" style="padding: 8px; border: 1px solid #334155;">TOTAL RECAUDADO ($)</td>
          </tr>
          ${Object.entries(summary.bartenders || {
            "Viviana Calva": { count: 0, revenue: 0 },
            "Carlos Ruiz": { count: 0, revenue: 0 },
            "Mateo Gómez": { count: 0, revenue: 0 },
            "Sofía Vega": { count: 0, revenue: 0 }
          }).map(([name, stats]) => `
            <tr>
              <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #1e293b;">${name}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; color: #475569;">${stats.count}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #94a3b8;">-</td>
              <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #b45309;">$${stats.revenue}.00</td>
            </tr>
          `).join("")}
          ` : ""}

          <tr><td colspan="6"></td></tr>
          <tr><td colspan="6"></td></tr>

          <!-- Tabla Auditada de Transacciones -->
          <tr style="background-color: #d97706; color: #ffffff; font-weight: bold; text-align: center;">
            <td style="padding: 8px; border: 1px solid #b45309;">Nº #</td>
            <td style="padding: 8px; border: 1px solid #b45309;">ID TRANSACCIÓN</td>
            <td style="padding: 8px; border: 1px solid #b45309;">BEBIDA / ARTÍCULO</td>
            <td style="padding: 8px; border: 1px solid #b45309;">BARTENDER</td>
            <td style="padding: 8px; border: 1px solid #b45309;">PRECIO ($)</td>
            <td style="padding: 8px; border: 1px solid #b45309;">HORA REGISTRO</td>
          </tr>
          ${filteredTx
            .map(
              (tx, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#fffbeb"};">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; color: #78350f;">#${totalCount - idx}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; text-align: center; color: #4b5563;">${tx.id}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #1e293b;">${tx.drinkName}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #b45309; text-align: center;">${tx.bartender || ""}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-weight: bold;">$${tx.price}.00</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace;">${new Date(tx.timestamp).toLocaleTimeString("es-EC")}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Reporte (${label}) descargado`);
  };

  if (!isOpen) return null;

  // Separate item types for UI display
  const itemsList = Object.entries(summary.items).map(([id, val]) => ({ id, ...val }));
  const specials = itemsList.filter((item) => item.category === "Cocteles Especiales");
  const bottles = itemsList.filter((item) => item.category === "Botellas");
  const myTransactions = (summary.transactions || []).filter((tx) => tx.bartender === activeBartender);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex flex-col w-screen h-screen bg-[#050505] text-white overflow-hidden"
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-5 left-1/2 z-[600] flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-950/90 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.5)] backdrop-blur-xl"
            >
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {!isAuthenticated ? (
          /* LOGIN SCREEN (Centered Fullscreen) */
          <div className="flex flex-1 items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)]">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-md rounded-[36px] border border-white/10 bg-[#080808] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.95)]"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-zinc-400 hover:text-white hover:border-white/30 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 mx-auto flex items-center justify-center gap-2 select-none">
                <svg
                  className="h-8 w-auto select-none"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="15" cy="31" r="10" fill="#f59e0b" />
                  <circle cx="15" cy="69" r="10" fill="#f59e0b" />
                  <path
                    d="M 50.5,71 L 50.5,48 A 19,19 0 0 1 88.5,48 L 88.5,71"
                    stroke="#ffffff"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="flex items-center text-2xl font-semibold font-quicksand lowercase tracking-normal leading-none select-none">
                  <span className="text-white">now</span>
                  <span className="text-amber-500">tickets</span>
                </span>
              </div>

              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-2">
                Punto de Venta de Barra
              </span>

              <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                Ventas de Bebidas
              </h2>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto mb-5">
                Selecciona tu nombre e ingresa tu contraseña para abrir la consola de licores en pantalla completa.
              </p>

              {/* Bartender Selector Grid on Login Screen */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {["Viviana Calva", "Carlos Ruiz", "Mateo Gómez", "Sofía Vega"].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setSelectedLoginBartender(name);
                      setPassword("");
                      setError("");
                    }}
                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition ${
                      selectedLoginBartender === name
                        ? "border border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                        : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`CONTRASEÑA DE ${selectedLoginBartender.split(" ")[0].toUpperCase()}`}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-center text-base font-bold tracking-[0.2em] text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                {error && (
                  <p className="text-center text-xs font-bold text-red-400 flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-98 transition duration-200 cursor-pointer"
                >
                  {loading ? "VERIFICANDO..." : "ABRIR CONSOLA DE BARRA"}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* FULLSCREEN POS DASHBOARD */
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="shrink-0 border-b border-white/[0.08] bg-[#070707] px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 select-none">
                  <svg
                    className="h-6 w-auto select-none"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="15" cy="31" r="10" fill="#f59e0b" />
                    <circle cx="15" cy="69" r="10" fill="#f59e0b" />
                    <path
                      d="M 50.5,71 L 50.5,48 A 19,19 0 0 1 88.5,48 L 88.5,71"
                      stroke="#ffffff"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="flex items-center text-lg font-semibold font-quicksand lowercase tracking-normal leading-none select-none hidden sm:flex">
                    <span className="text-white">now</span>
                    <span className="text-amber-500">tickets</span>
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/70 px-2.5 py-0.5 text-[7.5px] font-black uppercase tracking-[0.2em] text-amber-300">
                      BAR EN VIVO
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-300">
                      <User className="h-3 w-3 text-amber-400" />
                      Bartender: <strong className="text-white ml-0.5">{activeBartender}</strong>
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-white mt-0.5">
                    {eventTitle}
                  </h1>
                </div>
              </div>

              {/* Action Tools Header */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => exportToExcel(activeBartender)}
                  className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-950/50 px-4 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500 hover:text-black transition duration-200 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  <Download className="h-4 w-4" />
                  <span>Reporte Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!summary.transactions.some(tx => tx.bartender === activeBartender)}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
                  title="Revertir última venta"
                >
                  <Undo2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="hidden md:inline">Deshacer</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="flex items-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-950/30 px-3 sm:px-4 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-900/40 transition cursor-pointer"
                  title="Reiniciar caja de barra"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Reiniciar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthenticated(false);
                    setPassword("");
                  }}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  <User className="h-3.5 w-3.5 text-red-400" />
                  <span className="hidden md:inline">Salir</span>
                </button>

                <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Main Fullscreen Dashboard Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 no-scrollbar">
              {/* Metrics Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Revenue Card */}
                <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/50 via-zinc-950 to-black p-5 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.18)]">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Mi Recaudado</span>
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                  <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    ${summary.bartenders?.[activeBartender]?.revenue || 0}
                  </p>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-1 block">
                    Tu Efectivo en Caja
                  </span>
                </div>

                {/* Total Drinks Sold Card */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/60 to-black p-5 sm:p-6">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Mis Bebidas Entregadas</span>
                    <Wine className="h-6 w-6 text-amber-400" />
                  </div>
                  <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {summary.bartenders?.[activeBartender]?.count || 0}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">
                    Tus Unidades Vendidas
                  </span>
                </div>
              </div>

              {/* Main Quick Sale Tap Cards (Big POS Touch Area) */}
              <div className="space-y-6">
                {/* Specials Category */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                      Cocteles Especiales de la Noche
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {specials.map((drink) => {
                      const stockCount = drink.stock !== undefined ? drink.stock : 0;
                      const isSoldOut = stockCount <= 0;

                      return (
                        <motion.button
                          key={drink.id}
                          disabled={isSoldOut}
                          whileHover={isSoldOut ? {} : { scale: 1.02 }}
                          whileTap={isSoldOut ? {} : { scale: 0.96 }}
                          type="button"
                          onClick={() => handleSale(drink.id)}
                          className={`group relative overflow-hidden flex flex-col justify-between rounded-[28px] border-2 p-5 text-left transition min-h-[160px] ${
                            isSoldOut
                              ? "opacity-45 border-zinc-850 bg-zinc-950/90 cursor-not-allowed select-none"
                              : "border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-black hover:border-amber-400 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isSoldOut ? "bg-zinc-900 border-zinc-800 text-zinc-650" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                                <GlassWater className="h-4 w-4" />
                              </div>
                              <div>
                                <span className={`text-[9px] font-black uppercase tracking-widest block ${isSoldOut ? "text-zinc-550" : "text-amber-300"}`}>
                                  {isSoldOut ? "AGOTADO" : "ESPECIAL"}
                                </span>
                              </div>
                            </div>
                            <span className={`rounded-xl border-2 px-4 py-1.5 text-base font-black ${isSoldOut ? "border-zinc-800 bg-zinc-900 text-zinc-500" : "border-amber-400/80 bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]"}`}>
                              ${drink.price}.00
                            </span>
                          </div>
                          <div className="mt-3">
                            <h3 className={`text-lg font-black uppercase tracking-wide transition-colors ${isSoldOut ? "text-zinc-600" : "text-white group-hover:text-amber-300"}`}>
                              {drink.name}
                            </h3>
                            <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold text-zinc-400">
                              <span>{drink.count} vendidas · Recaudado: ${drink.revenue}</span>
                              <span className={isSoldOut ? "text-red-500 font-bold" : stockCount < 15 ? "text-amber-400 font-black animate-pulse" : "text-zinc-500"}>
                                Stock: {isSoldOut ? "0" : `${stockCount} / ${drink.initialStock || 200}`}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottles Category */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Wine className="h-4 w-4 text-orange-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                      Botellas de Licor (Servicio Completo)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bottles.map((drink) => {
                      const stockCount = drink.stock !== undefined ? drink.stock : 0;
                      const isSoldOut = stockCount <= 0;

                      return (
                        <motion.button
                          key={drink.id}
                          disabled={isSoldOut}
                          whileHover={isSoldOut ? {} : { scale: 1.02 }}
                          whileTap={isSoldOut ? {} : { scale: 0.96 }}
                          type="button"
                          onClick={() => handleSale(drink.id)}
                          className={`group relative overflow-hidden flex flex-col justify-between rounded-[28px] border-2 p-5 text-left transition min-h-[160px] ${
                            isSoldOut
                              ? "opacity-45 border-zinc-850 bg-zinc-950/90 cursor-not-allowed select-none"
                              : "border-orange-500/30 bg-gradient-to-br from-orange-950/20 via-zinc-950 to-black hover:border-orange-400 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isSoldOut ? "bg-zinc-900 border-zinc-800 text-zinc-650" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}`}>
                                <Wine className="h-4 w-4" />
                              </div>
                              <div>
                                <span className={`text-[9px] font-black uppercase tracking-widest block ${isSoldOut ? "text-zinc-550" : "text-orange-300"}`}>
                                  {isSoldOut ? "AGOTADO" : "BOTELLA"}
                                </span>
                              </div>
                            </div>
                            <span className={`rounded-xl border-2 px-4 py-1.5 text-base font-black ${isSoldOut ? "border-zinc-800 bg-zinc-900 text-zinc-500" : "border-orange-400/80 bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]"}`}>
                              ${drink.price}.00
                            </span>
                          </div>
                          <div className="mt-3">
                            <h3 className={`text-base font-black uppercase tracking-wide transition-colors truncate w-full ${isSoldOut ? "text-zinc-650" : "text-white group-hover:text-orange-300"}`}>
                              {drink.name}
                            </h3>
                            <div className="flex justify-between items-center mt-1.5 text-[10px] font-bold text-zinc-400">
                              <span>{drink.count} vendidas · Recaudado: ${drink.revenue}</span>
                              <span className={isSoldOut ? "text-red-500 font-bold" : stockCount < 10 ? "text-amber-400 font-black animate-pulse" : "text-zinc-500"}>
                                Stock: {isSoldOut ? "0" : `${stockCount} / ${drink.initialStock || 50}`}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Area: Spacious Real-Time Client Audit Stream */}
              <div className="rounded-[32px] border border-white/10 bg-[#09090b] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-wider text-white">
                        Auditoría de Barra en Tiempo Real
                      </h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                        Transacciones Registradas en este Turno
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-mono font-bold text-zinc-300">
                    {myTransactions.length} registros
                  </span>
                </div>

                {myTransactions.length === 0 ? (
                  <div className="py-14 text-center text-zinc-500 flex flex-col items-center justify-center">
                    <Wine className="h-12 w-12 text-zinc-700 mb-3" />
                    <p className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                      Aún no tienes ventas de barra registradas
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Registra una botella o cóctel usando los botones de arriba.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                    {myTransactions.map((tx, idx) => (
                      <div
                        key={tx.id || idx}
                        className="group flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-zinc-900/90 to-zinc-950 p-4 sm:p-5 transition duration-200 hover:border-white/30 hover:bg-zinc-900 shadow-md"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-xs font-black text-zinc-300 border border-white/10">
                            #{myTransactions.length - idx}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-white uppercase text-xs sm:text-sm tracking-wide truncate">
                              {tx.drinkName}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-zinc-400 font-mono font-medium">
                                {new Date(tx.timestamp).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                              <span className="text-[9.5px] font-bold text-amber-500 uppercase">
                                · {tx.bartender}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="shrink-0 font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full border border-amber-500/40 bg-amber-950/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          +${tx.price}.00
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Status Footer */}
            <footer className="shrink-0 border-t border-white/[0.08] bg-black px-6 py-3.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div>
                Barra Activa
              </div>
              <div>
                Última actualización: {new Date(summary.lastUpdated).toLocaleTimeString("es-EC")}
              </div>
            </footer>
          </div>
        )}

        {/* Security Reset Confirmation Modal Overlay */}
        <AnimatePresence>
          {showResetConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[700] flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm rounded-[32px] border border-red-500/40 bg-[#0a0a0a] p-6 sm:p-8 text-center shadow-[0_20px_80px_rgba(239,68,68,0.25)]"
              >
                <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-950/40 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
                  <RefreshCw className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-black uppercase text-white tracking-wide">
                  Confirmar Reinicio
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  Esta acción reiniciará las ventas de barra acumuladas a $0.00. Ingresa la contraseña de barra para confirmar.
                </p>

                <form onSubmit={handleConfirmReset} className="mt-6 space-y-4">
                  <div>
                    <input
                      type="password"
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      placeholder="CONTRASEÑA DE BARRA"
                      className="w-full rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-center text-sm font-bold tracking-[0.2em] text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                    />
                  </div>

                  {resetError && (
                    <p className="text-center text-xs font-bold text-red-400 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {resetError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmModal(false)}
                      className="flex-1 h-12 rounded-2xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 h-12 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-600 to-red-700 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_30px_rgba(239,68,68,0.35)] hover:brightness-110 active:scale-98 transition duration-200 cursor-pointer"
                    >
                      {resetLoading ? "VERIFICANDO..." : "REINICIAR"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
