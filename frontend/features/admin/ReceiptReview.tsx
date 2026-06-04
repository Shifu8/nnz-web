"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, ShieldCheck, Eye, ChevronDown, Loader2, FileCheck, FileX, Search, X } from "lucide-react";
import type { ReceiptRecord, ReceiptStatus } from "@/lib/access-drop/types";

type TabFilter = "todas" | ReceiptStatus;

export default function ReceiptReview() {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TabFilter>("todas");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReceiptRecord | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "todas") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/access-drop/receipts?${params}`);
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err) {
      console.error("Error loading receipts:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleReview = async (id: string, status: "aprobado" | "rechazado") => {
    setReviewing(true);
    try {
      const res = await fetch(`/api/access-drop/receipts/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewedBy: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        loadReceipts();
      }
    } catch (err) {
      console.error("Error reviewing receipt:", err);
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case "pendiente":
        return <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-2.5 py-0.5 text-[9px] font-black text-amber-400 uppercase tracking-wider">PENDIENTE</span>;
      case "aprobado":
        return <span className="rounded-full border border-green-500/40 bg-green-950/30 px-2.5 py-0.5 text-[9px] font-black text-green-400 uppercase tracking-wider">APROBADO</span>;
      case "rechazado":
        return <span className="rounded-full border border-red-500/40 bg-red-950/30 px-2.5 py-0.5 text-[9px] font-black text-red-400 uppercase tracking-wider">RECHAZADO</span>;
    }
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "pendiente", label: "Pendientes" },
    { key: "aprobado", label: "Aprobadas" },
    { key: "rechazado", label: "Rechazadas" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-widest">Comprobantes</h1>
        <p className="mt-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Revisión y validación de pagos
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                filter === tab.key
                  ? "bg-red-600 text-white"
                  : "border border-white/10 bg-black/40 text-zinc-400 hover:border-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-9 py-2.5 text-xs font-bold text-white placeholder-zinc-700 outline-none focus:border-red-500/50 sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">No hay comprobantes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/50">
                    {receipt.status === "aprobado" ? (
                      <FileCheck className="h-5 w-5 text-green-400" />
                    ) : receipt.status === "rechazado" ? (
                      <FileX className="h-5 w-5 text-red-400" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-wider">
                      {receipt.firstName} {receipt.lastName}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-500">
                      {receipt.phone} &middot; {receipt.referenceNumber} &middot; {receipt.quantity} entrada(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(receipt.status)}
                  <button
                    onClick={() => setSelected(selected?.id === receipt.id ? null : receipt)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-500 hover:text-white transition"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selected?.id === receipt.id && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">Comprobante</p>
                      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/60 p-4">
                        {receipt.mimeType === "application/pdf" ? (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <FileCheck className="h-10 w-10 text-zinc-500" />
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">PDF — Vista previa no disponible</p>
                          </div>
                        ) : (
                          <img
                            src={`/api/access-drop/receipts/${receipt.id}?file=true`}
                            alt="Comprobante"
                            className="max-h-64 rounded-lg object-contain"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">Datos del comprador</p>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                          <p className="text-[10px] font-bold text-white">{receipt.firstName} {receipt.lastName}</p>
                          <p className="text-[9px] text-zinc-400">📞 {receipt.phone}</p>
                          <p className="text-[9px] text-zinc-400">📧 {receipt.email}</p>
                          <p className="text-[9px] text-zinc-400">🆔 {receipt.documentNumber}</p>
                          <p className="text-[9px] text-zinc-400">🎫 {receipt.quantity} entrada(s)</p>
                          <p className="text-[9px] text-zinc-400">🔢 Ref: {receipt.referenceNumber}</p>
                          <p className="text-[9px] text-zinc-400">🏦 {receipt.paymentMethod}</p>
                        </div>
                      </div>

                      {receipt.ocrResult && (
                        <div>
                          <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                            OCR — Confianza: {receipt.ocrResult.confidence}%
                            {receipt.ocrResult.isSuspicious && (
                              <span className="ml-2 text-amber-400">⚠ SOSPECHOSO</span>
                            )}
                          </p>
                          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                            {receipt.ocrResult.detectedAmount && (
                              <p className="text-[9px] text-green-400 font-bold">💰 Monto: {receipt.ocrResult.detectedAmount}</p>
                            )}
                            {receipt.ocrResult.detectedDate && (
                              <p className="text-[9px] text-blue-400 font-bold">📅 Fecha: {receipt.ocrResult.detectedDate}</p>
                            )}
                            {receipt.ocrResult.detectedReference && (
                              <p className="text-[9px] text-purple-400 font-bold">🔗 Ref: {receipt.ocrResult.detectedReference}</p>
                            )}
                            {receipt.ocrResult.detectedBank && (
                              <p className="text-[9px] text-cyan-400 font-bold">🏦 Banco: {receipt.ocrResult.detectedBank}</p>
                            )}
                            {receipt.ocrResult.suspiciousReason && (
                              <p className="mt-1 text-[8px] text-amber-500 font-bold uppercase tracking-wider">⚠ {receipt.ocrResult.suspiciousReason}</p>
                            )}
                            <details className="mt-2">
                              <summary className="cursor-pointer text-[8px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-wider">
                                Ver texto extraído
                              </summary>
                              <pre className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-black/60 p-2 text-[8px] text-zinc-500 font-mono whitespace-pre-wrap">
                                {receipt.ocrResult.extractedText || "Sin texto"}
                              </pre>
                            </details>
                          </div>
                        </div>
                      )}

                      {receipt.status === "pendiente" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReview(receipt.id, "aprobado")}
                            disabled={reviewing}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-green-500 disabled:opacity-50"
                          >
                            {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            APROBAR
                          </button>
                          <button
                            onClick={() => handleReview(receipt.id, "rechazado")}
                            disabled={reviewing}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-500 disabled:opacity-50"
                          >
                            {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileX className="h-4 w-4" />}
                            RECHAZAR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
