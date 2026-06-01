"use client";

import { useState, useRef, type CSSProperties } from "react";
import {
  ChevronRight,
  ShieldAlert,
  Upload,
  FileCheck,
  Loader2,
  CreditCard,
  Building2,
  Zap,
} from "lucide-react";

const TICKET_DESIGNS = [
  { id: 1, gradient: "from-red-900 via-red-950 to-black", accent: "red", label: "TRAP LOUD · YAN BLOCK", serial: "DAWGS-0001-A", name: "BLOCK CARD" },
  { id: 2, gradient: "from-[#C8FF00]/20 via-black to-black", accent: "lime", label: "VIP ACCESS · YAN BLOCK", serial: "DAWGS-0002-B", name: "BELLAKITA CARD" },
];

interface BankTransferInfoProps {
  selectedBank: string;
  onSelectBank: (bankId: string) => void;
  quantity: number;
  totalPrice: number;
  selectedDesign: number;
  formData: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  onUploadComplete: (result: {
    receiptId: string;
    status: string;
    autoRejected: boolean;
    rejectionReason?: string | null;
  }) => void;
  onBack: () => void;
}

const BANKS = [
  {
    id: "banco-loja",
    name: "Banco Loja",
    label: "AHORITA",
    qrImage: "/images/qr-banco-loja.png",
    accountType: "AHORROS",
    accountNumber: "XXXX-XXXX-XXXX",
    phone: "0999999999",
  },
  {
    id: "banco-pichincha",
    name: "Banco Pichincha",
    label: "DE UNA",
    qrImage: "/images/qr-banco-pichincha.png",
    accountType: "CORRIENTE",
    accountNumber: "XXXX-XXXX-XXXX",
    phone: "0999999999",
  },
];

export default function BankTransferInfo({
  selectedBank,
  onSelectBank,
  quantity,
  totalPrice,
  selectedDesign,
  formData,
  onUploadComplete,
  onBack,
  onClose,
}: BankTransferInfoProps & { onClose?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selected = BANKS.find((b) => b.id === selectedBank) || BANKS[0];
  const ticketDesign = TICKET_DESIGNS.find((d) => d.id === selectedDesign) || TICKET_DESIGNS[0];

  const handleFileSelect = (file: File | null) => {
    setErrorMsg("");
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("ARCHIVO MUY GRANDE. MÁXIMO 5MB.");
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".pdf"].includes(ext)) {
      setErrorMsg("FORMATO NO SOPORTADO. USA JPG, PNG O PDF.");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!selectedFile) {
      setErrorMsg("SELECCIONA UN COMPROBANTE.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.append("comprobante", selectedFile);
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("phone", formData.phone);
      body.append("quantity", quantity.toString());
      body.append("paymentMethod", selectedBank);

      const res = await fetch("/api/access-drop/upload", { method: "POST", body });
      const data = await res.json() as {
        error?: string;
        receiptId: string;
        status: string;
        autoRejected: boolean;
        rejectionReason?: string | null;
      };

      if (!res.ok) throw new Error(data.error || "Error al subir comprobante");

      onUploadComplete({
        receiptId: data.receiptId,
        status: data.status,
        autoRejected: data.autoRejected,
        rejectionReason: data.rejectionReason,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir comprobante";
      setErrorMsg(message.toUpperCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl relative">
      {onClose && (
        <button
          onClick={onClose}
          className="glass-pill glass-pill-red absolute -top-4 -right-3 z-50"
        >
          <ChevronRight className="h-3 w-3 rotate-180" /> SALIR
        </button>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.3fr] md:items-start">
        {/* LEFT: Ticket preview + review */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 text-center">tu entrada</p>
            <div className="relative overflow-hidden rounded-2xl border-2 border-white/10 max-w-[260px] mx-auto">
              <div className={`absolute inset-0 bg-gradient-to-br ${ticketDesign.gradient} opacity-90`} />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_60%)]" />
              <div className="relative p-5 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-1.5 ${ticketDesign.accent === "red" ? "text-red-400" : "text-[#C8FF00]"}`}>
                    <Zap className="h-3 w-3" />
                    <span className={`text-[7px] font-black uppercase tracking-[0.3em] ${ticketDesign.accent === "red" ? "text-red-400" : "text-[#C8FF00]"}`}>DAWGS</span>
                  </div>
                  <div className={`h-4 w-4 rounded-full border ${ticketDesign.accent === "red" ? "border-red-500/40" : "border-[#C8FF00]/40"}`} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[11px] font-black text-white uppercase tracking-wider leading-tight">{ticketDesign.label}</p>
                  <div className={`mt-2 h-px w-3/4 ${ticketDesign.accent === "red" ? "bg-red-500/30" : "bg-[#C8FF00]/30"}`} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-[7px] font-mono font-bold ${ticketDesign.accent === "red" ? "text-red-300" : "text-[#C8FF00]/70"}`}>{ticketDesign.serial}</p>
                  <div className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5">
                    <p className="text-[6px] font-black uppercase tracking-wider text-zinc-500">{ticketDesign.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">revisa tus datos</p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">teléfono</p>
                <p className="text-xs font-bold text-white">{formData.phone}</p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">entradas</p>
                <p className="text-xs font-bold text-white">x{quantity}</p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">total</p>
                <p className="text-lg font-black text-[#C8FF00]">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
              <p className="text-[7px] font-bold uppercase tracking-wider text-amber-400 leading-relaxed">
                ⚠ Verifica que tus datos sean correctos. Si el teléfono no es el correcto, <span className="text-red-400">no podremos contactarte</span>.
              </p>
              <p className="text-[7px] font-bold uppercase tracking-wider text-amber-400 leading-relaxed mt-2">
                Revisa bien antes de enviar el comprobante.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Bank + Account + QR + Upload */}
        <div className="space-y-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3 text-center">Paga con</p>
            <div className="grid grid-cols-2 gap-3">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => onSelectBank(bank.id)}
                  className={`glass-select-tile p-4 text-center transition-all duration-300 ${
                    selectedBank === bank.id
                      ? "glass-select-tile-active scale-[1.02]"
                      : "hover:border-white/25"
                  }`}
                >
                  {selectedBank === bank.id && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,24,.08),transparent_60%)]" />
                  )}
                  <div className="relative">
                    <Building2 className={`mx-auto h-6 w-6 ${selectedBank === bank.id ? "text-red-400" : "text-zinc-500"}`} />
                    <p className={`mt-1.5 text-[10px] font-black uppercase tracking-wider ${selectedBank === bank.id ? "text-white" : "text-zinc-400"}`}>
                      {bank.name}
                    </p>
                    <p className={`mt-0.5 text-sm font-black tracking-widest ${selectedBank === bank.id ? "text-[#C8FF00]" : "text-zinc-600"}`}>
                      {bank.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-red-400" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">cuenta</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">a nombre de:</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-white tracking-wider">MEDINA BRANDON</p>
                <span className="rounded-full border border-red-500/20 bg-red-950/40 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-red-300">miembro dawgs</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3 text-center">código QR</p>
            <div className="flex justify-center">
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/40 p-5 w-fit">
                <img
                  src={selected.qrImage}
                  alt={`QR ${selected.name}`}
                  className="h-32 w-32 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">QR no disponible</div>';
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-1">
              <p className="ml-2 text-[7px] uppercase tracking-widest text-zinc-500 font-bold">sube tu comprobante (JPG, PNG, PDF)</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0] || null); }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${
                  dragOver
                    ? "border-red-500 bg-red-950/20"
                    : selectedFile
                      ? "border-green-500/40 bg-green-950/10"
                      : "border-white/10 bg-black/40 hover:border-white/20"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                {selectedFile && preview ? (
                  <div className="w-full">
                    <img src={preview} alt="" className="mx-auto max-h-32 rounded-lg object-contain" />
                    <p className="mt-2 text-center text-[8px] font-bold text-green-400 uppercase tracking-wider">
                      <FileCheck className="mr-1 inline h-3 w-3" /> {selectedFile.name}
                    </p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="glass-action glass-action-danger mx-auto mt-2" style={{ "--glass-action-height": "28px", "--glass-action-px": "0.75rem", "--glass-action-text": "0.44rem" } as CSSProperties}>
                      eliminar
                    </button>
                  </div>
                ) : selectedFile ? (
                  <div className="text-center">
                    <FileCheck className="mx-auto h-8 w-8 text-green-400" />
                    <p className="mt-2 text-[8px] font-bold text-green-400 uppercase tracking-wider">{selectedFile.name}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="glass-action glass-action-danger mx-auto mt-2" style={{ "--glass-action-height": "28px", "--glass-action-px": "0.75rem", "--glass-action-text": "0.44rem" } as CSSProperties}>
                      eliminar
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mb-2 h-7 w-7 text-zinc-600" />
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">ARRASTRA O SELECCIONA</p>
                    <p className="mt-1 text-[6px] text-zinc-700 uppercase tracking-widest">JPG, PNG o PDF — 5MB máx</p>
                  </>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-3 text-[9px] font-bold text-red-400 bg-red-950/40 p-4 rounded-xl border border-red-500/30">
                <ShieldAlert className="h-4 w-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <button
              disabled={isSubmitting || !selectedFile}
              type="button"
              onClick={() => { if (!selectedFile) { setErrorMsg("SELECCIONA UN COMPROBANTE."); return; } setShowConfirm(true); }}
              className="glass-action glass-action-primary w-full"
              style={{ "--glass-action-height": "56px", "--glass-action-text": "0.78rem" } as CSSProperties}
            >
              ENVIAR COMPROBANTE <ChevronRight className="h-4 w-4" />
            </button>

            <button type="button" onClick={onBack} className="glass-action glass-action-quiet w-full text-zinc-300" style={{ "--glass-action-height": "46px", "--glass-action-text": "0.68rem" } as CSSProperties}>
              <ChevronRight className="h-3.5 w-3.5 rotate-180" /> volver al registro
            </button>

            {showConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400 mb-4 text-center">confirmar datos</p>
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">nombre</p>
                      <p className="text-xs font-bold text-white">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">teléfono</p>
                      <p className="text-xs font-bold text-white">{formData.phone}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">entradas</p>
                      <p className="text-xs font-bold text-white">x{quantity}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">diseño</p>
                      <p className="text-xs font-bold text-white">{ticketDesign.name}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">banco</p>
                      <p className="text-xs font-bold text-white">{selected.name}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">total</p>
                      <p className="text-lg font-black text-[#C8FF00]">${totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowConfirm(false)} className="glass-action glass-action-quiet flex-1 text-zinc-300" style={{ "--glass-action-height": "44px", "--glass-action-text": "0.65rem" } as CSSProperties}>
                      VOLVER
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowConfirm(false); handleSubmit(); }}
                      disabled={isSubmitting}
                      className="glass-action glass-action-primary flex-1"
                      style={{ "--glass-action-height": "44px", "--glass-action-text": "0.65rem" } as CSSProperties}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> ENVIANDO...</>
                      ) : (
                        <>CONFIRMAR <ChevronRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
