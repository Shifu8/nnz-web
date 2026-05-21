/**
 * Autor: Brandon Medina
 * Fecha: 20/05/2026
 * Descripción: Card premium del Party Pass con estética Cactus Jack/DJ Dawg y descarga a PNG.
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
      const dataUrl = await toPng(passRef.current, { cacheBust: true, backgroundColor: "#050505" });
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
      {/* Ticket Container */}
      <motion.div 
        ref={passRef}
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="relative w-full max-w-[360px] aspect-[1/1.6] overflow-hidden rounded-[38px] border-2 border-zinc-800 bg-[#050505] p-6 shadow-[0_30px_100px_rgba(200,255,0,0.12)] select-none"
      >
        {/* Glow Spheres for Atmosphere */}
        <div className="absolute -left-20 -top-20 h-44 w-44 rounded-full bg-red-600/10 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-[#C8FF00]/10 blur-[60px] pointer-events-none" />
        
        {/* Grid Background Overlay for industrial look */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Screaming Dawg Sketch SVG (Charcoal background) */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-25 mix-blend-screen pointer-events-none" 
          viewBox="0 0 360 576" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer contours */}
          <path d="M40 180 C20 230, 30 330, 50 410 C70 450, 110 480, 150 450 C170 430, 190 380, 200 310 C210 230, 170 190, 110 170 C70 160, 50 170, 40 180 Z" stroke="#333333" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M45 175 C25 225, 35 325, 52 405 C72 445, 115 475, 155 445" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Screaming Eyes (Double Exposure) */}
          <path d="M80 220 C60 220, 60 250, 80 250 C100 250, 100 220, 80 220 Z" stroke="#333333" strokeWidth="3" />
          <line x1="60" y1="235" x2="100" y2="235" stroke="#333333" strokeWidth="3.5" />
          
          <path d="M130 215 C110 215, 110 245, 130 245 C150 245, 150 215, 130 215 Z" stroke="#333333" strokeWidth="3" />
          <line x1="110" y1="230" x2="150" y2="230" stroke="#333333" strokeWidth="3.5" />

          {/* Third Eye */}
          <path d="M105 190 C90 190, 90 215, 105 215 C120 215, 120 190, 105 190 Z" stroke="#444444" strokeWidth="2.2" />
          <line x1="90" y1="202" x2="120" y2="202" stroke="#444444" strokeWidth="2" />

          {/* Screaming Mouth with Jagged Teeth */}
          <path d="M70 320 Q110 300 150 320 Q160 370 140 410 Q95 430 60 400 Q55 360 70 320 Z" stroke="#333333" strokeWidth="4.5" fill="#080808" />
          {/* Teeth upper */}
          <path d="M75 320 L82 340 L89 320 L96 340 L103 320 L110 340 L117 320 L124 340 L131 320 L138 340 L145 320" stroke="#333333" strokeWidth="3" fill="none" />
          {/* Teeth lower */}
          <path d="M62 390 L70 370 L78 390 L86 370 L94 390 L102 370 L110 390 L118 370 L126 390 L134 370 L138 385" stroke="#333333" strokeWidth="3" fill="none" />

          {/* Shading & splatters */}
          <path d="M30 280 L10 300 M25 300 L5 320 M35 330 L15 350" stroke="#2a2a2a" strokeWidth="2" />
          <circle cx="70" cy="140" r="3" fill="#333333" />
          <circle cx="200" cy="230" r="4.5" fill="#333333" />
          <circle cx="90" cy="480" r="2.5" fill="#2a2a2a" />

          {/* Graffiti tag "DAWG" */}
          <path d="M210 390 C220 390, 225 405, 220 410 C215 415, 210 410, 215 400 M230 392 L235 410 M232 402 L238 402 M238 392 L233 410 M245 392 L248 410 L252 392 L256 410 M265 395 C260 395, 260 402, 265 405 C268 407, 268 410, 263 410" stroke="#2e2e2e" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Header */}
          <div className="flex w-full items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C8FF00]">DAWGS VIP ACCESS</span>
            </div>
            <span className="rounded-full bg-red-600/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-red-500 border border-red-500/30">
              ESTRICTO
            </span>
          </div>

          {/* Mid Section: Overlapping Neon green sticker */}
          <div className="relative flex-1 flex items-start pt-6">
            
            {/* Travis Scott-style Neon Sticker Circle */}
            <div className="absolute -right-4 top-2 w-[180px] h-[180px] rounded-full bg-[#C8FF00] p-4 flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(200,255,0,0.25)] rotate-6 border-[3px] border-black z-20 transition-transform duration-300 hover:rotate-12">
              <span className="text-black font-black text-[23px] tracking-tighter leading-none select-none uppercase">
                DAWGS
              </span>
              <span className="text-black font-extrabold text-[8px] tracking-[0.22em] leading-none uppercase select-none mt-0.5">
                PARTY PASS
              </span>
              <span className="text-black font-black text-[7px] uppercase tracking-wider mt-2.5 select-none text-center">
                FEAT. YAN BLOCK
              </span>
              <span className="text-black font-semibold text-[5px] tracking-[0.15em] uppercase mt-2 opacity-80 select-none">
                PERFORMED BY:
              </span>
              <span className="text-black font-black text-[9px] uppercase tracking-tight line-clamp-1 max-w-[140px] text-center select-none">
                {data.firstName} {data.lastName}
              </span>
              <span className="text-black font-extrabold text-[6px] tracking-widest mt-1 select-none">
                LIVE FROM SAN JUAN
              </span>
              <span className="text-black font-medium text-[4.5px] tracking-widest text-black/60 mt-1 select-none">
                FOR VIP ACCESS ONLY
              </span>
            </div>
            
            {/* Left side details (distressed badge) */}
            <div className="flex flex-col gap-1 items-start max-w-[130px] mt-4">
              <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-sm">
                <p className="text-[6px] font-black uppercase tracking-[0.2em] text-zinc-500">EVENT TYPE</p>
                <p className="text-[9px] font-bold text-white uppercase mt-0.5">CONCIERTO LIVE</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-sm mt-1">
                <p className="text-[6px] font-black uppercase tracking-[0.2em] text-zinc-500">ACCESO</p>
                <p className="text-[9px] font-bold text-[#C8FF00] uppercase mt-0.5">TICKET GENERAL</p>
              </div>
            </div>
          </div>

          {/* Bottom Section: QR and Metadata */}
          <div className="mt-auto pt-4 border-t border-zinc-900 flex items-end justify-between gap-4">
            
            {/* QR Code Container with neon accent */}
            <div className="shrink-0 rounded-2xl border-[3px] border-[#C8FF00] bg-white p-2.5 shadow-[0_0_20px_rgba(200,255,0,0.15)]">
              <QRCodeCanvas 
                value={data.qrPayload} 
                size={100} 
                level="H" 
                includeMargin={false} 
                fgColor="#000000" 
                bgColor="#ffffff" 
              />
            </div>

            {/* Monospace Metadata Stamp */}
            <div className="flex-1 flex flex-col gap-1.5 text-right font-mono text-[8px] tracking-wider text-zinc-400 uppercase">
              <div>
                <span className="text-zinc-600 block text-[6px]">HOLDER</span>
                <span className="text-white font-bold block text-[10px] tracking-normal leading-tight truncate max-w-[160px]">
                  {data.firstName} {data.lastName}
                </span>
              </div>
              <div>
                <span className="text-zinc-600 block text-[6px]">EVENT</span>
                <span className="text-white font-semibold">TRAP LOUD</span>
              </div>
              <div>
                <span className="text-zinc-600 block text-[6px]">DATE & PLACE</span>
                <span className="text-white font-semibold">18 JUN 2026 - SJ</span>
              </div>
              <div className="mt-1 rounded border border-zinc-800 bg-zinc-950/80 py-1 px-1.5 inline-block w-fit ml-auto">
                <span className="text-zinc-500 text-[6px] block">SERIAL</span>
                <span className="text-[#C8FF00] font-bold font-mono text-[8px] tracking-normal select-text">
                  {data.serialNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-4 text-center border-t border-zinc-900/60 pt-2 pointer-events-none">
            <p className="text-[6.5px] uppercase tracking-[0.25em] text-zinc-600">
              * MANTENER QR SEGURO • ESCANEAR AL INGRESAR *
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-6 flex w-full max-w-[360px] gap-3 px-2">
        <button 
          onClick={handleDownload}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#C8FF00] text-[9.5px] font-black uppercase tracking-widest text-black transition hover:bg-[#b0e000] active:scale-95 shadow-[0_4px_20px_rgba(200,255,0,0.2)]"
        >
          <Download className="h-4 w-4" /> descargar png
        </button>
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-white/5 text-white transition hover:bg-white/10 active:scale-95">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
