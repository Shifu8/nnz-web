"use client";

import { motion } from "framer-motion";

export default function NfcChip3D({ className = "", white }: { className?: string; white?: boolean }) {
  return (
    <div className={`perspective-dramatic ${className}`}>
      <motion.div
        className="relative w-28 h-18"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      >
        {/* Front face - white card */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-white to-zinc-100 border border-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center gap-1 p-2"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-16 h-10 rounded-lg border-2 border-zinc-300 bg-white flex items-center justify-center shadow-inner">
            <div className="w-8 h-5 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center">
              <div className="w-4 h-2.5 rounded-sm bg-gradient-to-r from-zinc-300 to-zinc-200" />
            </div>
          </div>
          <span className="text-[5px] font-black text-zinc-400 uppercase tracking-[0.3em]">NFC</span>
        </div>

        {/* Back face - white card */}
        <div
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-zinc-100 to-white border border-zinc-200 flex items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-8 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center">
              <svg className="w-6 h-4 text-zinc-300" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="22" height="14" rx="2" />
                <path d="M5 6h14M5 10h10" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[4px] font-bold text-zinc-300 uppercase tracking-[0.2em]">NENEZ</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
