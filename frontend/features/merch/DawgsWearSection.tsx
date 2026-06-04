"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ShieldCheck, Sparkles, AtSign, Scan, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_NUMBER = "593XXXXXXXXX";

const wearCollection = [
  {
    id: "outfit-1",
    name: "DAWGS Signature Hoodie (Burgundy & Rose)",
    price: "75",
    image: "/images/kristina_merch.png",
    modelName: "Kristina (@kris_handle)",
    instagramUrl: "https://instagram.com/kris_handle",
    description: "Heavyweight 450gsm luxury cotton blend.",
    category: "Streetwear Lookbook",
  },
  {
    id: "outfit-2",
    name: "DAWGS Classic Tracksuit (Deep Cherry)",
    price: "110",
    image: "/images/ariana_merch.png",
    modelName: "Ariana (@ariana_handle)",
    instagramUrl: "https://instagram.com/ariana_handle",
    description: "Complete luxury streetwear tracksuit set.",
    category: "Tracksuit & Loungewear",
  },
  {
    id: "outfit-3",
    name: "DAWGS Heavyweight Hoodie (Crimson)",
    price: "75",
    image: "/images/johanel_merch.png",
    modelName: "Johanel (@johanel_handle)",
    instagramUrl: "https://instagram.com/johanel_handle",
    description: "Oversized drop-shoulder silhouette in rich mineral-washed crimson.",
    category: "Exclusive Drops",
  },
  {
    id: "outfit-4",
    name: "DAWGS Tactical Signal Parka (Matte Black)",
    price: "135",
    image: "/images/model_one.png",
    modelName: "Leo (@leo_wear)",
    instagramUrl: "https://instagram.com/leo_wear",
    description: "Waterproof technical outer-shell with modular utility belts.",
    category: "Cyberpunk Tech-Wear",
  },
  {
    id: "outfit-5",
    name: "DAWGS Tech-wear Cyber-vest (Graphite)",
    price: "95",
    image: "/images/model_two.png",
    modelName: "Dante (@dante_raw)",
    instagramUrl: "https://instagram.com/dante_raw",
    description: "Reinforced tactical vest with graphite nylon layers.",
    category: "Cyberpunk Tech-Wear",
  },
  {
    id: "outfit-6",
    name: "DAWGS Industrial Utility Jacket (Olive Drab)",
    price: "120",
    image: "/images/model_three.png",
    modelName: "Kael (@kael_ops)",
    instagramUrl: "https://instagram.com/kael_ops",
    description: "Distressed denim and duck canvas jacket with industrial wash finish.",
    category: "Industrial Workwear",
  },
];

export default function DawgsWearSection() {
  const [currentModel, setCurrentModel] = useState(0);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "done">("idle");
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModel((prev) => (prev + 1) % wearCollection.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showCatalogModal || showScanModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showCatalogModal, showScanModal]);

  const model = wearCollection[currentModel];

  const handleScan = () => {
    setShowScanModal(true);
    setScanStep("scanning");
    setTimeout(() => setScanStep("done"), 2500);
  };

  return (
    <section id="merch" className="relative z-10 w-full py-32 border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[140px]" />
        <div className="absolute bottom-20 right-20 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16 xl:px-20">
        {/* ===== HERO ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Rotating Model */}
          <div className="lg:col-span-5 relative h-[420px] md:h-[520px] rounded-[36px] overflow-hidden border border-white/10 bg-black/30 backdrop-blur-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <Image src={model.image} alt={model.modelName} fill className="object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              </motion.div>
            </AnimatePresence>

            <a href={model.instagramUrl} target="_blank" rel="noopener noreferrer"
              className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:border-red-500/50 transition"
            >
              <AtSign className="w-3 h-3 text-[#C8FF00]" />
              <span className="text-[8px] font-black text-white tracking-widest">{model.modelName.split(" ")[0]}</span>
            </a>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {wearCollection.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentModel ? "bg-white w-4" : "bg-white/30"}`} />
              ))}
            </div>
          </div>

          {/* Center: spacer */}
          <div className="lg:col-span-3" />

          {/* Right: Enter + Scan */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">DAWGS Collection</p>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter">
              NOTHING IS{" "}
              <span className="text-red-500 italic">REAL</span>
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Colección exclusiva con tecnología NFC integrada. Cada prenda cuenta con un chip de autenticación.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <button
                onClick={() => setShowCatalogModal(true)}
                className="glass-action glass-action-lime flex-1"
                style={{ "--glass-action-height": "56px", "--glass-action-text": "0.74rem" } as CSSProperties}
              >
                Entrar <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleScan}
                className="glass-action glass-action-quiet flex-1"
                style={{ "--glass-action-height": "56px", "--glass-action-text": "0.74rem" } as CSSProperties}
              >
                <Scan className="w-4 h-4" /> Scan NFC
              </button>
            </div>
          </div>
        </div>

        {/* ===== NFC Info Card ===== */}
        <div className="mt-20 max-w-2xl mx-auto">
          <div className="rounded-[28px] border border-white/10 bg-black/20 backdrop-blur-3xl p-6 md:p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-8 rounded-lg border border-zinc-600/40 bg-zinc-900/60 flex items-center justify-center shadow-inner">
                <div className="w-7 h-4 rounded-[3px] border border-zinc-500/40 bg-zinc-800/80 flex items-center justify-center">
                  <span className="text-[5px] font-black text-zinc-400 tracking-[0.2em]">NFC</span>
                </div>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Tecnología NFC</h3>
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Chip de autenticación integrado en cada prenda</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-lg mx-auto">
              Cada prenda DAWGS cuenta con un chip NFC en la etiqueta. Escanéalo con tu celular para verificar autenticidad, 
              acceder a información detallada y conocer los cuidados de la prenda.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-[#C8FF00] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Auténtico
            </div>
          </div>
        </div>
      </div>

      {/* ===== CATALOG MODAL ===== */}
      <AnimatePresence>
        {showCatalogModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] overflow-y-auto bg-black/80 backdrop-blur-2xl p-4 flex items-start justify-center pt-10 pb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-5xl rounded-[40px] border border-white/10 bg-black/60 backdrop-blur-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(255,255,255,0.03)]"
            >
              <button onClick={() => setShowCatalogModal(false)} className="glass-pill absolute top-4 left-4 z-50">
                <X className="w-3 h-3" /> CERRAR
              </button>

              <div className="mb-8 mt-4">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.5em]">Catálogo</p>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-1">DAWGS Collection</h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-md">Desliza hacia abajo para ver todas las prendas disponibles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
                {wearCollection.map((outfit) => (
                  <div key={outfit.id} className="rounded-[28px] border border-white/10 bg-black/30 backdrop-blur-xl p-3 transition-all duration-500 hover:border-red-500/20 group overflow-hidden flex flex-col">
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                      <Sparkles className="w-2 h-2 text-[#C8FF00]" />
                      <span className="text-[5px] font-black text-[#C8FF00] uppercase tracking-widest">NFC</span>
                    </div>

                    <div className="relative h-[300px] md:h-[360px] w-full rounded-[20px] overflow-hidden border border-white/5 bg-zinc-900">
                      <Image src={outfit.image} alt={outfit.name} fill className="object-cover object-top transition-transform duration-[1.8s] group-hover:scale-105 brightness-[0.9] group-hover:brightness-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <span className="text-[6px] font-black text-[#C8FF00] tracking-widest uppercase">{outfit.category}</span>
                        <p className="text-sm font-black text-white mt-0.5 leading-tight">{outfit.name}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between px-1">
                      <div>
                        <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Precio</span>
                        <p className="text-lg font-mono font-black text-white mt-0.5">${outfit.price}</p>
                      </div>
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola DAWGS, quiero comprar ${outfit.name} - ${outfit.category}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-2xl bg-[#C8FF00] hover:bg-[#b5e600] text-black px-4 py-3 text-[10px] font-black uppercase tracking-widest transition shadow-[0_0_20px_rgba(200,255,0,0.15)] active:scale-95"
                      >
                        <ShoppingBag className="w-3 h-3" /> Comprar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SCAN MODAL ===== */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-[40px] border border-white/10 bg-black/60 backdrop-blur-3xl p-8 text-center"
            >
              <button onClick={() => { setShowScanModal(false); setScanStep("idle"); }} className="glass-pill absolute top-4 left-4">
                <X className="w-3 h-3" /> CERRAR
              </button>

              {scanStep === "scanning" && (
                <div className="py-12 flex flex-col items-center">
                  <div className="relative h-32 w-32 mb-8">
                    <motion.div className="absolute inset-0 rounded-2xl border-2 border-white/20 bg-white/5"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div className="absolute inset-2 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center overflow-hidden">
                      <motion.div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8FF00] to-transparent"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="w-14 h-9 rounded-lg border border-zinc-600/30 bg-zinc-900/60 flex items-center justify-center shadow-inner">
                        <div className="w-8 h-5 rounded-[3px] border border-zinc-500/30 bg-zinc-800/80 flex items-center justify-center">
                          <span className="text-[6px] font-black text-zinc-400 tracking-[0.2em]">NFC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Escaneando NFC...</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-2">Acerca tu teléfono a la etiqueta</p>
                </div>
              )}

              {scanStep === "done" && (
                <div className="py-12 flex flex-col items-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
                    className="w-20 h-20 rounded-full bg-[#C8FF00]/10 border-2 border-[#C8FF00] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(200,255,0,0.15)]"
                  >
                    <ShieldCheck className="w-10 h-10 text-[#C8FF00]" />
                  </motion.div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Prenda Autenticada</h3>
                  <p className="text-[9px] text-zinc-400 mt-2 max-w-xs">Chip NFC verificado. Producto original DAWGS.</p>
                  <div className="mt-6 flex gap-3">
                    <Link href="/verify/obsession-hoodie"
                      onClick={() => { setShowScanModal(false); setScanStep("idle"); }}
                      className="flex items-center gap-2 rounded-2xl bg-white text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-white/90 transition"
                    >
                      Ver Prenda <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
