"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Download, Send, Palette, Image as ImageIcon, Type, QrCode,
  Calendar, MapPin, Clock, User, Hash, Loader2, Check,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useToast } from "./Toast";

type TicketDesignData = {
  eventTitle: string;
  eventSubtitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  serialNumber: string;
  qrValue: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  headerBg: string;
};

const DEFAULT_DESIGN: TicketDesignData = {
  eventTitle: "TRAP LOUD",
  eventSubtitle: "YAN BLOCK EXPERIENCE",
  eventDate: "18 JUN 2026",
  eventTime: "22:00",
  eventLocation: "San Juan",
  buyerName: "BRANDON MEDINA",
  buyerPhone: "+593 98 765 4321",
  quantity: 2,
  serialNumber: "NENEZ-1234-ABCD",
  qrValue: "NENEZ-PASS-1234-ABCD",
  backgroundColor: "#0a0a0a",
  accentColor: "#C8FF00",
  textColor: "#ffffff",
  headerBg: "#1a0000",
};

function TicketTemplate({ data }: { data: TicketDesignData }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qrValue)}`;

  return (
    <div
      style={{
        width: "400px",
        minHeight: "600px",
        background: data.backgroundColor,
        borderRadius: "24px",
        overflow: "hidden",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        position: "relative",
        boxShadow: `0 0 40px ${data.accentColor}22, 0 0 0 1px ${data.accentColor}33`,
      }}
    >
      {/* Header with glow */}
      <div
        style={{
          background: `linear-gradient(135deg, ${data.headerBg}, ${data.backgroundColor})`,
          padding: "28px 24px 20px",
          borderBottom: `1px solid ${data.accentColor}22`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: `${data.accentColor}15`,
            filter: "blur(40px)",
          }}
        />
        <div style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "0.15em", position: "relative", zIndex: 1 }}>
          NENEZ
        </div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: `${data.accentColor}99`, letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "2px", position: "relative", zIndex: 1 }}>
          Acceso · Entrada Única
        </div>
      </div>

      {/* Event info */}
      <div style={{ padding: "20px 24px 16px" }}>
        <div style={{ fontSize: "20px", fontWeight: 900, color: data.textColor, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {data.eventTitle}
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: data.accentColor, marginTop: "4px", letterSpacing: "0.05em" }}>
          {data.eventSubtitle}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          {[
            { icon: "📅", label: data.eventDate },
            { icon: "⏰", label: data.eventTime },
            { icon: "📍", label: data.eventLocation },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "9px", fontWeight: 700, color: "#a1a1aa",
              background: `${data.accentColor}08`,
              padding: "4px 10px", borderRadius: "20px",
              border: `1px solid ${data.accentColor}15`,
            }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider with glow */}
      <div style={{ padding: "0 24px" }}>
        <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${data.accentColor}44, transparent)`, position: "relative" }}>
          <div style={{ position: "absolute", top: "-1px", left: "20%", right: "20%", height: "3px", background: `${data.accentColor}22`, filter: "blur(4px)" }} />
        </div>
      </div>

      {/* QR Code */}
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#ffffff", borderRadius: "16px", padding: "12px",
          boxShadow: `0 0 30px ${data.accentColor}22`,
          border: `2px solid ${data.accentColor}33`,
        }}>
          <img src={qrUrl} alt="QR" style={{ width: "140px", height: "140px", display: "block" }} />
        </div>
      </div>

      {/* Serial */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "7px", fontWeight: 700, color: "#71717a", letterSpacing: "0.3em", textTransform: "uppercase" }}>
          Serial Number
        </div>
        <div style={{ fontSize: "12px", fontWeight: 900, color: data.accentColor, letterSpacing: "0.1em", marginTop: "2px" }}>
          {data.serialNumber}
        </div>
      </div>

      {/* Divider */}
      <div style={{ padding: "0 24px" }}>
        <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${data.accentColor}33, transparent)` }} />
      </div>

      {/* Buyer info */}
      <div style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "7px", fontWeight: 700, color: "#71717a", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              Titular
            </div>
            <div style={{ fontSize: "13px", fontWeight: 900, color: data.textColor, marginTop: "2px" }}>
              {data.buyerName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "7px", fontWeight: 700, color: "#71717a", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              Cantidad
            </div>
            <div style={{ fontSize: "13px", fontWeight: 900, color: data.accentColor, marginTop: "2px" }}>
              x{data.quantity}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "auto",
        padding: "12px 24px",
        borderTop: `1px solid ${data.accentColor}15`,
        background: `${data.accentColor}05`,
        textAlign: "center",
      }}>
        <div style={{ fontSize: "7px", fontWeight: 700, color: "#52525b", letterSpacing: "0.3em" }}>
          VÁLIDO POR UNA SOLA OCASIÓN · NENEZ
        </div>
      </div>
    </div>
  );
}

export default function TicketDesigner() {
  const { toast } = useToast();
  const [data, setData] = useState<TicketDesignData>(DEFAULT_DESIGN);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const updateData = (key: keyof TicketDesignData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGeneratePDF = useCallback(async () => {
    if (!templateRef.current) return;
    setGenerating(true);
    try {
      const pngData = await toPng(templateRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [400, 620],
      });

      const imgProps = pdf.getImageProperties(pngData);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (imgProps.height * pdfW) / imgProps.width;
      pdf.addImage(pngData, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");

      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `entrada-${data.serialNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast("success", "PDF generado", "La entrada se descargó correctamente.");
    } catch (err) {
      toast("error", "Error", "No se pudo generar el PDF.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [data, toast]);

  const handleSendWhatsApp = useCallback(async () => {
    if (!templateRef.current) return;
    setSending(true);
    try {
      const pngData = await toPng(templateRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [400, 620] });
      const imgProps = pdf.getImageProperties(pngData);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (imgProps.height * pdfW) / imgProps.width;
      pdf.addImage(pngData, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");
      const pdfBlob = pdf.output("blob");

      const formData = new FormData();
      formData.append("file", pdfBlob, `entrada-${data.serialNumber}.pdf`);
      formData.append("phone", data.buyerPhone.replace(/\D/g, ""));
      formData.append("name", data.buyerName);

      const res = await fetch("/api/admin/send-ticket-whatsapp", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        toast("success", "Enviado", "La entrada se envió por WhatsApp.");
      } else {
        toast("error", "Error de envío", result.error || "No se pudo enviar.");
      }
    } catch (err) {
      toast("error", "Error", "No se pudo enviar la entrada.");
      console.error(err);
    } finally {
      setSending(false);
    }
  }, [data, toast]);

  const colors = [
    { label: "Verde Neón", bg: "#0a0a0a", accent: "#C8FF00", header: "#1a0000" },
    { label: "Rojo Sangre", bg: "#0a0a0a", accent: "#ef4444", header: "#1a0000" },
    { label: "Azul Eléctrico", bg: "#0a0a0a", accent: "#3b82f6", header: "#000d1a" },
    { label: "Violeta", bg: "#0a0a0a", accent: "#a855f7", header: "#0d001a" },
    { label: "Blanco", bg: "#ffffff", accent: "#ef4444", header: "#fafafa", textColor: "#0a0a0a" },
    { label: "Noche", bg: "#050505", accent: "#22c55e", header: "#000000" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Editor */}
      <div className="space-y-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Diseño</p>
          <p className="text-xl font-black text-white mt-1">Editor de Entradas</p>
        </div>

        {/* Colors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-zinc-400" />
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Colores</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button key={c.label} onClick={() => { updateData("backgroundColor", c.bg); updateData("accentColor", c.accent); updateData("headerBg", c.header); updateData("textColor", (c as any).textColor || "#ffffff"); }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                  data.accentColor === c.accent && data.backgroundColor === c.bg
                    ? "border-white/30 bg-white/10"
                    : "border-white/[0.06] bg-black/40 hover:border-white/20"
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="h-4 w-4 rounded" style={{ background: c.bg, border: "1px solid rgba(255,255,255,0.1)" }} />
                  <div className="h-4 w-4 rounded" style={{ background: c.accent }} />
                </div>
                <span className="text-[8px] font-bold text-zinc-400">{c.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Fields */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Evento", key: "eventTitle", icon: Type },
              { label: "Subtítulo", key: "eventSubtitle", icon: Type },
              { label: "Fecha", key: "eventDate", icon: Calendar },
              { label: "Hora", key: "eventTime", icon: Clock },
              { label: "Ubicación", key: "eventLocation", icon: MapPin },
              { label: "Comprador", key: "buyerName", icon: User },
              { label: "Teléfono", key: "buyerPhone", icon: User },
              { label: "Serial", key: "serialNumber", icon: Hash },
            ].map(({ label, key, icon: Icon }) => (
              <div key={key} className="space-y-1">
                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                  <Icon className="h-3 w-3" /> {label}
                </p>
                <input value={(data as any)[key]} onChange={(e) => updateData(key as keyof TicketDesignData, e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-xs font-bold text-white placeholder-zinc-800 outline-none transition focus:border-[#C8FF00]/50"
                />
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Hash className="h-3 w-3" /> Cantidad
              </p>
              <input type="number" min={1} value={data.quantity} onChange={(e) => updateData("quantity", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-xs font-bold text-white placeholder-zinc-800 outline-none transition focus:border-[#C8FF00]/50"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <QrCode className="h-3 w-3" /> QR Value
              </p>
              <input value={data.qrValue} onChange={(e) => updateData("qrValue", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-xs font-bold text-white placeholder-zinc-800 outline-none transition focus:border-[#C8FF00]/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleGeneratePDF} disabled={generating}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#C8FF00] py-3.5 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#d4ff33] disabled:opacity-50 shadow-[0_0_25px_rgba(200,255,0,0.2)]"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {generating ? "Generando..." : "Descargar PDF"}
          </button>
          <button onClick={handleSendWhatsApp} disabled={sending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-green-500 disabled:opacity-50 shadow-[0_0_25px_rgba(34,197,94,0.2)]"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Enviando..." : "Enviar WhatsApp"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Vista Previa</p>
          <div className="flex justify-center overflow-hidden rounded-2xl" ref={templateRef}>
            <TicketTemplate data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
