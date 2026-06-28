"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

import { motion, AnimatePresence } from "framer-motion";

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallApp({ label, className }: { label?: string; className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPrompt | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const params = new URLSearchParams(window.location.search);
    if (params.has("install")) {
      const p = (window as any).__deferredPrompt as BeforeInstallPrompt | undefined;
      if (p) {
        p.prompt();
        p.userChoice.then(() => {
          window.history.replaceState({}, "", window.location.pathname);
        });
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    (window as any).__deferredPrompt = deferredPrompt;
  }, [deferredPrompt]);

  const handleClick = useCallback(async () => {
    if (isStandalone) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      return;
    }

    if (isMobile && typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "DAWGS", url: window.location.origin }).catch(() => {});
      return;
    }

    setIsOpen(true);
  }, [deferredPrompt, isMobile, isStandalone]);

  if (isStandalone) return null;

  const installUrl = typeof window !== "undefined" ? window.location.origin + "?install=1" : "";

  return (
    <>
      <button onClick={handleClick} className={className || "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"}>

        <span className="leading-none">{label || "Descarga la App"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pb-4 pt-[45vh] backdrop-blur-lg"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/90 p-8 pt-10 shadow-[0_0_80px_rgba(0,0,0,0.9)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:bg-white/20 hover:text-white"
              >
                <span>✕</span>
              </button>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20">
                  <span className="text-2xl">📱</span>
                </div>
                <p className="text-sm font-black uppercase tracking-wider text-white">Escanea desde tu m&oacute;vil</p>
                <div className="rounded-2xl bg-white p-4">
                  <QRCodeSVG value={installUrl} size={180} bgColor="#ffffff" fgColor="#000000" />
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Abre la c&aacute;mara y escanea el c&oacute;digo para instalar DAWGS en tu celular
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
