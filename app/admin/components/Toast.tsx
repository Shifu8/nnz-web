"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, Info, Loader2 } from "lucide-react";

type ToastType = "success" | "error" | "info" | "loading";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextType = {
  toast: (type: ToastType, title: string, message?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <Check className="h-4 w-4 text-green-400" />,
  error: <X className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
  loading: <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />,
};

const BORDERS: Record<ToastType, string> = {
  success: "border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
  error: "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  info: "border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  loading: "border-zinc-500/30",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`rounded-2xl border ${BORDERS[t.type]} bg-zinc-950/90 backdrop-blur-xl px-4 py-3 shadow-xl`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/10">
                  {ICONS[t.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white uppercase tracking-wider">{t.title}</p>
                  {t.message && <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">{t.message}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:text-white transition">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
