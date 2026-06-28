"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";


type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.origin);
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (dismissed || isStandalone) return null;

  const isMobileInstallReady = deferredPrompt !== null || isMobile;

  return (
    <div className="fixed bottom-6 right-6 z-[150] max-w-[280px]">
      <div className="relative rounded-2xl border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded-full p-1 text-zinc-500 transition hover:bg-white/10 hover:text-white"
        >
          <span>✕</span>
        </button>

        {isMobileInstallReady ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20">
              <span className="text-xl">⬇</span>
            </div>
            <p className="text-center text-[11px] font-bold uppercase tracking-wider text-white leading-relaxed">
              Descarga la App
            </p>
            <p className="text-center text-[9px] text-zinc-400 leading-relaxed">
              Acceso directo desde tu pantalla de inicio
            </p>
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="mt-1 w-full rounded-xl bg-red-600 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-red-500"
              >
                Instalar
              </button>
            ) : (
              <div className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-center text-[9px] text-zinc-400 leading-relaxed">
                Safari: Compartir &rarr; Agregar a Inicio
                <br />
                Chrome: Men&uacute; &rarr; Instalar app
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xl">📱</span>
            <p className="text-center text-[11px] font-bold uppercase tracking-wider text-white">
              Escanea en tu m&oacute;vil
            </p>
            <div className="rounded-xl bg-white p-2">
              <QRCodeSVG value={url} size={140} bgColor="#ffffff" fgColor="#000000" />
            </div>
            <p className="text-center text-[9px] text-zinc-400 leading-relaxed">
              Abre la c&aacute;mara de tu celular y escanea para abrir DAWGS
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
