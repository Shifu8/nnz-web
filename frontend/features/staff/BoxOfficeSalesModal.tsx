"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  RefreshCw,
  Undo2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Award,
  Users,
  Download,
  TrendingUp,
  Clock,
  PieChart,
  Sparkles,
  User,
} from "lucide-react";
import type { Event } from "@/frontend/types/domain";

interface BoxOfficeSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
}

interface PosSaleRecord {
  id: string;
  ticketType: "student" | "general";
  ticketName: string;
  price: number;
  timestamp: string;
}

interface PosSalesSummary {
  studentCount: number;
  studentRevenue: number;
  generalCount: number;
  generalRevenue: number;
  totalCount: number;
  totalRevenue: number;
  cashierName?: string;
  lastUpdated: string;
  transactions: PosSaleRecord[];
}

export default function BoxOfficeSalesModal({
  isOpen,
  onClose,
  event,
}: BoxOfficeSalesModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Security confirmation for Reset
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Sales Stats & History
  const [summary, setSummary] = useState<PosSalesSummary>({
    studentCount: 0,
    studentRevenue: 0,
    generalCount: 0,
    generalRevenue: 0,
    totalCount: 0,
    totalRevenue: 0,
    cashierName: "Viviana Calva",
    lastUpdated: new Date().toISOString(),
    transactions: [],
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Event details
  const eventTitle = event?.title || "DAWG NIGHT";
  const eventVenue = event?.venue || "Mónaco Nightclub";

  // Load stats from API on login or modal open
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/pos/sales");
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
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "sales" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Contraseña de ventas incorrecta");
        return;
      }

      setIsAuthenticated(true);
      fetchSummary();
    } catch {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async (type: "student" | "general") => {
    const price = type === "student" ? 5 : 8;
    const label = type === "student" ? "Carnet Universitario ($5)" : "Entrada General ($8)";

    const newRecord: PosSaleRecord = {
      id: crypto.randomUUID(),
      ticketType: type,
      ticketName: type === "student" ? "Carnet Universitario" : "General (Sin Carnet)",
      price,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    setSummary((prev) => {
      const isStudent = type === "student";
      const newStudentCount = isStudent ? prev.studentCount + 1 : prev.studentCount;
      const newStudentRev = isStudent ? prev.studentRevenue + price : prev.studentRevenue;
      const newGeneralCount = !isStudent ? prev.generalCount + 1 : prev.generalCount;
      const newGeneralRev = !isStudent ? prev.generalRevenue + price : prev.generalRevenue;

      return {
        ...prev,
        studentCount: newStudentCount,
        studentRevenue: newStudentRev,
        generalCount: newGeneralCount,
        generalRevenue: newGeneralRev,
        totalCount: newStudentCount + newGeneralCount,
        totalRevenue: newStudentRev + newGeneralRev,
        lastUpdated: new Date().toISOString(),
        transactions: [newRecord, ...prev.transactions].slice(0, 50),
      };
    });

    showToast(`+1 ${label} ($${price})`);

    try {
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sale", type }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
      }
    } catch {}
  };

  const handleUndo = async () => {
    if (summary.totalCount === 0) return;

    try {
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        showToast("Última venta revertida");
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
      // Validate sales password via login API
      const authRes = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordInput, role: "sales" }),
      });

      if (!authRes.ok) {
        setResetError("Contraseña de taquilla incorrecta");
        setResetLoading(false);
        return;
      }

      // Password valid, proceed to reset sales
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        setShowResetConfirmModal(false);
        setResetPasswordInput("");
        showToast("Contador de caja reiniciado a $0");
      }
    } catch {
      setResetError("Error conectando al servidor");
    } finally {
      setResetLoading(false);
    }
  };

  const exportToExcel = () => {
    const nowStr = new Date().toLocaleString("es-EC");
    const filename = `Cierre_Taquilla_${eventTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xls`;

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Cierre de Taquilla</x:Name>
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
          .kpi-header { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #1e293b; padding: 10px; }
          .student-row { background-color: #ecfdf5; color: #047857; font-weight: bold; }
          .general-row { background-color: #faf5ff; color: #6b21a8; font-weight: bold; }
          .total-row { background-color: #0f172a; color: #34d399; font-weight: bold; font-size: 14px; }
          .audit-header { background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0369a1; padding: 8px; }
          .border-cell { border: 1px solid #e2e8f0; padding: 8px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .mono { font-family: monospace; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="5" style="font-size: 16px; font-weight: bold; color: #10b981; background-color: #070707; text-align: center; padding: 14px; border: 1px solid #000000;">
              NOWTICKETS — REPORTE DE CIERRE DE CAJA DE TAQUILLA
            </td>
          </tr>
          <tr><td colspan="5"></td></tr>

          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Evento:</td>
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f172a;">${eventTitle}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Lugar / Ubicación:</td>
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; color: #334155;">${eventVenue}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Taquillero(a) a Cargo:</td>
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #047857;">${summary.cashierName || "Viviana Calva"}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px;">Fecha de Exportación:</td>
            <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; color: #334155;">${nowStr}</td>
          </tr>
          <tr><td colspan="5"></td></tr>

          <!-- Resumen de Ventas -->
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center;">
            <td colspan="2" style="padding: 10px; border: 1px solid #334155;">CONCEPTO DE ENTRADA</td>
            <td style="padding: 10px; border: 1px solid #334155;">ENTRADAS VENDIDAS</td>
            <td style="padding: 10px; border: 1px solid #334155;">PRECIO UNITARIO</td>
            <td style="padding: 10px; border: 1px solid #334155;">TOTAL RECAUDADO ($)</td>
          </tr>
          <tr style="background-color: #ecfdf5;">
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #047857;">Entrada Carnet Universitario</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; color: #047857;">${summary.studentCount}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #047857;">$5.00</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #047857;">$${summary.studentRevenue}.00</td>
          </tr>
          <tr style="background-color: #faf5ff;">
            <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #6b21a8;">Entrada General (Sin Carnet)</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; color: #6b21a8;">${summary.generalCount}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #6b21a8;">$8.00</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; color: #6b21a8;">$${summary.generalRevenue}.00</td>
          </tr>
          <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold;">
            <td colspan="2" style="border: 1px solid #334155; padding: 10px;">TOTAL CAJA EN EFECTIVO</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: center; font-size: 13px; color: #34d399;">${summary.totalCount} entradas</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: right;">-</td>
            <td style="border: 1px solid #334155; padding: 10px; text-align: right; font-size: 15px; color: #34d399;">$${summary.totalRevenue}.00</td>
          </tr>

          <tr><td colspan="5"></td></tr>
          <tr><td colspan="5"></td></tr>

          <!-- Tabla Auditada de Transacciones -->
          <tr style="background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center;">
            <td style="padding: 8px; border: 1px solid #0369a1;">Nº #</td>
            <td style="padding: 8px; border: 1px solid #0369a1;">ID TRANSACCIÓN</td>
            <td style="padding: 8px; border: 1px solid #0369a1;">TIPO DE ENTRADA</td>
            <td style="padding: 8px; border: 1px solid #0369a1;">PRECIO ($)</td>
            <td style="padding: 8px; border: 1px solid #0369a1;">HORA REGISTRO</td>
          </tr>
          ${(summary.transactions || [])
            .map(
              (tx, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; color: #64748b;">#${summary.totalCount - idx}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; text-align: center; color: #475569;">${tx.id}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: ${tx.price === 5 ? "#047857" : "#6b21a8"};">${tx.ticketName}</td>
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
    showToast("Reporte Excel descargado (.xls)");
  };

  if (!isOpen) return null;

  const avgPerClient = summary.totalCount > 0 ? (summary.totalRevenue / summary.totalCount).toFixed(2) : "0.00";
  const studentRatio = summary.totalCount > 0 ? Math.round((summary.studentCount / summary.totalCount) * 100) : 0;
  const generalRatio = summary.totalCount > 0 ? 100 - studentRatio : 0;

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
              className="fixed top-5 left-1/2 z-[600] flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-950/90 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.5)] backdrop-blur-xl"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {!isAuthenticated ? (
          /* LOGIN SCREEN (Centered Fullscreen) */
          <div className="flex flex-1 items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]">
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
                  <circle cx="15" cy="31" r="10" fill="#e10075" />
                  <circle cx="15" cy="69" r="10" fill="#e10075" />
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
                  <span style={{ color: "#e10075" }}>tickets</span>
                </span>
              </div>

              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-2">
                Punto de Venta de Taquilla
              </span>

              <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                Ventas de Puerta
              </h2>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Ingresa tus credenciales de taquillero para abrir la consola de ventas en pantalla completa.
              </p>

              <form onSubmit={handleLogin} className="mt-6 w-full space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="CONTRASEÑA DE TAQUILLA"
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-center text-base font-bold tracking-[0.2em] text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
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
                  className="w-full h-12 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-98 transition duration-200 cursor-pointer"
                >
                  {loading ? "VERIFICANDO..." : "ABRIR CONSOLA DE TAQUILLA"}
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
                    <circle cx="15" cy="31" r="10" fill="#e10075" />
                    <circle cx="15" cy="69" r="10" fill="#e10075" />
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
                    <span style={{ color: "#e10075" }}>tickets</span>
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-[7.5px] font-black uppercase tracking-[0.2em] text-emerald-300">
                      TAQUILLA EN VIVO
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-300">
                      <User className="h-3 w-3 text-emerald-400" />
                      Taquillero(a): <strong className="text-white ml-0.5">{summary.cashierName || "Viviana Calva"}</strong>
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
                  onClick={exportToExcel}
                  className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500 hover:text-black transition duration-200 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Reporte</span> Excel
                </button>

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={summary.totalCount === 0}
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
                  title="Reiniciar contador de caja"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Reiniciar</span>
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
                <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 via-zinc-950 to-black p-5 sm:p-6 shadow-[0_0_35px_rgba(16,185,129,0.18)]">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Recaudado en Caja</span>
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    ${summary.totalRevenue}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1 block">
                    Total Efectivo en Caja
                  </span>
                </div>

                {/* Total Clients / Tickets Card */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/60 to-black p-5 sm:p-6">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Clientes Atendidos</span>
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {summary.totalCount}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">
                    Entradas Registradas en Puerta
                  </span>
                </div>
              </div>

              {/* Main Quick Sale Tap Cards (Big POS Touch Area) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    Consola Principal de Registro de Entradas
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    Toca para registrar venta
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Button 1: Carnet Universitario $5 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => handleSale("student")}
                    className="group relative overflow-hidden flex flex-col justify-between rounded-[32px] border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-950/70 via-zinc-950 to-black p-6 sm:p-8 text-left shadow-[0_0_50px_rgba(16,185,129,0.25)] hover:border-emerald-400 transition cursor-pointer active:brightness-125 min-h-[220px]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 block">
                            DESCUENTO ESTUDIANTIL
                          </span>
                          <span className="text-xs font-bold text-zinc-400">Requisito: Carnet Vigente</span>
                        </div>
                      </div>
                      <span className="rounded-2xl border-2 border-emerald-400/80 bg-emerald-500 px-5 py-2 text-lg sm:text-xl font-black text-black shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                        $5.00
                      </span>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide group-hover:text-emerald-300 transition-colors">
                        Entrada Carnet Universitario
                      </h3>
                      <p className="text-xs font-bold text-zinc-400 mt-1">
                        {summary.studentCount} vendidas · Total: ${summary.studentRevenue}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-center rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-emerald-300 group-hover:bg-emerald-500 group-hover:text-black transition duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      +1 REGISTRAR VENTA ($5)
                    </div>
                  </motion.button>

                  {/* Button 2: General $8 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => handleSale("general")}
                    className="group relative overflow-hidden flex flex-col justify-between rounded-[32px] border-2 border-purple-500/60 bg-gradient-to-br from-purple-950/70 via-zinc-950 to-black p-6 sm:p-8 text-left shadow-[0_0_50px_rgba(168,85,247,0.25)] hover:border-purple-400 transition cursor-pointer active:brightness-125 min-h-[220px]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-purple-300 block">
                            PÚBLICO GENERAL
                          </span>
                          <span className="text-xs font-bold text-zinc-400">Acceso Estándar</span>
                        </div>
                      </div>
                      <span className="rounded-2xl border-2 border-purple-400/80 bg-purple-600 px-5 py-2 text-lg sm:text-xl font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                        $8.00
                      </span>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide group-hover:text-purple-300 transition-colors">
                        Entrada General (Sin Carnet)
                      </h3>
                      <p className="text-xs font-bold text-zinc-400 mt-1">
                        {summary.generalCount} vendidas · Total: ${summary.generalRevenue}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-center rounded-2xl bg-purple-500/20 border-2 border-purple-500/50 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition duration-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      +1 REGISTRAR VENTA ($8)
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Bottom Area: Spacious Real-Time Client Audit Stream */}
              <div className="rounded-[32px] border border-white/10 bg-[#09090b] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-wider text-white">
                        Registro de Clientes en Puerta
                      </h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                        Historial de Ventas del Turno
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-mono font-bold text-zinc-300">
                    {summary.transactions.length} registros
                  </span>
                </div>

                {summary.transactions.length === 0 ? (
                  <div className="py-14 text-center text-zinc-500 flex flex-col items-center justify-center">
                    <Ticket className="h-12 w-12 text-zinc-700 mb-3" />
                    <p className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                      Aún no hay ventas registradas en este turno
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Toca un botón de arriba para registrar una entrada y aparecerá aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                    {summary.transactions.map((tx, idx) => (
                      <div
                        key={tx.id || idx}
                        className="group flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-zinc-900/90 to-zinc-950 p-4 sm:p-5 transition duration-200 hover:border-white/30 hover:bg-zinc-900 shadow-md"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-xs font-black text-zinc-300 border border-white/10">
                            #{summary.totalCount - idx}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-white uppercase text-xs sm:text-sm tracking-wide truncate">
                              {tx.ticketName}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-mono font-medium block mt-0.5">
                              {new Date(tx.timestamp).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <span className={`shrink-0 font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full border ${tx.price === 5 ? "border-emerald-500/40 bg-emerald-950/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-purple-500/40 bg-purple-950/70 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]"}`}>
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
                Taquilla Activa
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
                  Esta acción reiniciará las ventas acumuladas a $0.00. Ingresa la contraseña de taquilla para confirmar.
                </p>

                <form onSubmit={handleConfirmReset} className="mt-6 space-y-4">
                  <div>
                    <input
                      type="password"
                      autoFocus
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      placeholder="CONTRASEÑA DE TAQUILLA"
                      className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3.5 text-center text-sm font-bold tracking-[0.2em] text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  {resetError && (
                    <p className="text-center text-xs font-bold text-red-400 flex items-center justify-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {resetError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmModal(false)}
                      className="rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-600 to-rose-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:brightness-110 active:scale-95 transition cursor-pointer"
                    >
                      {resetLoading ? "..." : "Reiniciar"}
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
