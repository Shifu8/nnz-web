"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Droplets, Wind, Sun, Thermometer, AlertTriangle, Sparkles, ShoppingBag } from "lucide-react";
import NfcChip3D from "@/frontend/components/NfcChip3D";

interface Product {
  name: string;
  type: string;
  collection: string;
  price: number;
  image: string;
  material: string;
  color: string;
  nfcId: string;
}

const careInstructions = [
  { icon: Droplets, title: "Lavado", items: ["Lavar a mano o en máquina en ciclo suave con agua fría o tibia (máx. 30°C)", "No usar blanqueadores ni cloro", "Usar detergentes suaves sin químicos agresivos"] },
  { icon: Wind, title: "Secado", items: ["Secar al aire, colgado y sin exposición directa al sol por largos períodos", "Secadora a baja temperatura si es necesario", "Evitar calor excesivo – puede dañar las fibras sintéticas"] },
  { icon: AlertTriangle, title: "Etiqueta NFC", items: ["El calor elevado puede dañar el chip", "No planchar directamente sobre la etiqueta"] },
  { icon: Thermometer, title: "Planchado", items: ["No es necesario planchar el fleece", "Si es necesario, usar temperatura baja con tela de protección"] },
  { icon: Sun, title: "Suavizantes", items: ["Evitar suavizantes de telas – alteran la textura del fleece"] },
  { icon: Wind, title: "Almacenaje", items: ["Guardar en lugar seco y ventilado, preferiblemente colgado", "No apilar ni comprimir para mantener la forma"] },
];

const serialPrefixes: Record<string, string> = {
  "obsession-hoodie": "NENEZ-NIR-H",
  "obsession-jogger": "NENEZ-NIR-J",
  "obsession-set": "NENEZ-NIR-S",
};

export default function NfcVerifyClient({ product }: { product: Product }) {
  const serial = useMemo(() => {
    const prefix = serialPrefixes[product.nfcId] || "NENEZ-NIR-";
    const unique = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${unique}`;
  }, [product.nfcId]);

  const verifyDate = useMemo(() => new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" }), []);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(200,255,0,0.04),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(239,68,68,0.06),transparent_40%)] pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:border-red-500/50 hover:text-white transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>

        <div className="mt-6 rounded-[40px] border border-white/[0.06] bg-black/20 backdrop-blur-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(200,255,0,0.02)]">
          {/* Verified Badge + Serial */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 rounded-full border border-[#C8FF00]/30 bg-[#C8FF00]/5 px-4 py-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <ShieldCheck className="w-4 h-4 text-[#C8FF00]" />
              </motion.div>
              <span className="text-[9px] font-black text-[#C8FF00] uppercase tracking-widest">NFC Verificado</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span className="text-[8px] font-mono font-bold text-zinc-300 tracking-wider">{serial}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* 3D Product Display */}
            <div className="perspective-dramatic">
              <motion.div
                className="relative w-full aspect-[3/4] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                style={{ transformStyle: "preserve-3d" }}
                initial={{ rotateY: -10, rotateX: 5 }}
                animate={{ rotateY: [0, 5, 0, -5, 0], rotateX: [2, -2, 3, -1, 2], z: [0, 20, 0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[size:100%_6px] pointer-events-none" />

                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-[#C8FF00]/30"
                      style={{ left: `${10 + i * 12}%`, top: `${15 + i * 10}%` }}
                      animate={{ y: [-10, -35, -10], opacity: [0, 0.6, 0] }}
                      transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
                    />
                  ))}
                </div>

                <div className="absolute bottom-6 left-6 right-6 z-10">
                  <span className="text-[8px] font-black text-[#C8FF00] uppercase tracking-[0.3em]">{product.collection}</span>
                  <h2 className="text-2xl font-black text-white mt-1">{product.name}</h2>
                  <p className="text-xs text-zinc-400 mt-1">{product.type}</p>
                </div>
              </motion.div>

              <motion.div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              >
                <NfcChip3D white />
                <div>
                  <p className="text-[9px] font-black text-[#C8FF00] uppercase tracking-widest">NFC Authenticated</p>
                  <p className="text-[7px] text-zinc-500 uppercase tracking-wider">Chip integrado · NENEZ ORIGINAL</p>
                </div>
              </motion.div>
            </div>

            {/* Product Info + Care */}
            <div className="space-y-6">
              {/* Exclusive Badge */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-[#C8FF00]/20 bg-gradient-to-r from-[#C8FF00]/5 to-transparent p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">PRENDA EXCLUSIVA</p>
                  <span className="text-[7px] font-mono font-black text-[#C8FF00]">{verifyDate}</span>
                </div>
                <p className="text-lg font-mono font-black text-white tracking-tight">{serial}</p>
                <p className="text-[8px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Esta prenda es única · Serie limitada</p>
              </motion.div>

              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">{product.collection}</p>
                <h1 className="text-3xl md:text-4xl font-black text-white mt-2">{product.name}</h1>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-mono font-black text-[#C8FF00]">${product.price}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider">+ IVA</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Material</p>
                  <p className="text-xs font-bold text-white mt-1">{product.material}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Color</p>
                  <p className="text-xs font-bold text-white mt-1">{product.color}</p>
                </div>
              </div>

              {/* Care Instructions */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C8FF00]" /> Cuidados de la prenda
                </h3>
                <div className="space-y-3">
                  {careInstructions.map((section) => (
                    <div key={section.title}>
                      <div className="flex items-center gap-2 mb-1">
                        <section.icon className="w-3 h-3 text-zinc-500" />
                        <h4 className="text-[9px] font-black text-zinc-300 uppercase tracking-wider">{section.title}</h4>
                      </div>
                      <ul className="space-y-0.5 ml-5">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-[10px] text-zinc-500 leading-relaxed list-disc">{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <a href={`https://wa.me/593XXXXXXXXX?text=${encodeURIComponent(`Hola NENEZ, quiero comprar el ${product.name} (${product.type}) de la colección ${product.collection}.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-[#C8FF00] text-black font-black text-xs uppercase tracking-widest hover:bg-[#b5e600] transition shadow-[0_0_30px_rgba(200,255,0,0.2)]"
              >
                <ShoppingBag className="w-4 h-4" /> Comprar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
