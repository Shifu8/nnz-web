/**
 * Autor: Brandon Medina
 * Fecha: 16/05/2026
 * Descripción: Card premium del Party Pass con descarga real a PNG.
 */

"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";

type PartyPassProps = {
  data: {
    firstName: string;
    lastName: string;
    serialNumber: string;
    qrPayload: string;
  };
};

export default function PartyPass({ data }: PartyPassProps) {
  const passRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (passRef.current === null) return;
    try {
      const dataUrl = await toPng(passRef.current, { cacheBust: true, backgroundColor: "#000" });
      const link = document.createElement('a');
      link.download = `DAWGS-PASS-${data.serialNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error downloading pass:", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        ref={passRef}
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-red-500/30 bg-black p-6 shadow-[0_30px_100px_rgba(255,0,24,0.4)]"
      >
        {/* Glow effects */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-red-600/20 blur-[60px]" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-red-600/20 blur-[60px]" />
        
        <div className="relative z-10 flex flex-col items-center">
          {/* Header */}
          <div className="flex w-full items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">founding dawg</span>
            </div>
            <span className="rounded-full bg-red-600/10 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-red-500 border border-red-500/20">limited access</span>
          </div>

          {/* Branding */}
          <div className="mt-6 text-center">
            <h2 className="text-4xl font-black tracking-[0.2em] text-white">DAWGS</h2>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.5em] text-zinc-500">party pass protocol</p>
          </div>

          {/* QR Code Section */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white p-4">
            <QRCodeCanvas value={data.qrPayload} size={180} level="H" includeMargin={true} fgColor="#000000" bgColor="#ffffff" />
          </div>

          {/* User Data */}
          <div className="mt-8 w-full space-y-4 text-center">
            <div>
              <p className="text-[8px] uppercase tracking-widest text-zinc-500">pass holder</p>
              <h3 className="mt-1 text-2xl font-black uppercase text-white">{data.firstName} {data.lastName}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div className="text-left">
                <p className="text-[8px] uppercase tracking-widest text-zinc-500">event</p>
                <p className="text-[10px] font-bold text-white uppercase">trap loud</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-widest text-zinc-500">date</p>
                <p className="text-[10px] font-bold text-white uppercase">may 2026</p>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 py-2">
              <p className="text-[8px] uppercase tracking-widest text-red-400">serial number</p>
              <p className="text-[10px] font-mono font-black text-white">{data.serialNumber}</p>
            </div>
          </div>
          
          <p className="mt-6 text-[7px] uppercase tracking-[0.3em] text-zinc-600">verification required at door • non-transferable</p>
        </div>
      </motion.div>

      {/* Actions (Outside capture area) */}
      <div className="mt-8 flex w-full max-w-sm gap-3 px-4">
        <button 
          onClick={handleDownload}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-zinc-200 active:scale-95"
        >
          <Download className="h-4 w-4" /> download png
        </button>
        <button className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 active:scale-95">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

