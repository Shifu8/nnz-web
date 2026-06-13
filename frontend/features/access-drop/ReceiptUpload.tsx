"use client";

import { useState, useRef } from "react";
import { Upload, ShieldAlert, FileCheck, Loader2 } from "lucide-react";
import { validateReceiptFileMetadata } from "@/lib/access-drop/fileValidation";

type ReceiptUploadProps = {
  onUpload: (file: File, referenceNumber: string) => Promise<void>;
};

export default function ReceiptUpload({ onUpload }: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (f: File | null) => {
    setError("");
    if (!f) { setFile(null); setPreview(null); return; }
    const validationError = validateReceiptFileMetadata(f);
    if (validationError) { setError(validationError.message); return; }
    setFile(f);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !refNumber.trim()) return;
    setLoading(true);
    try {
      await onUpload(file, refNumber.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message.toUpperCase() : "ERROR.");
    }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold mb-1">número de comprobante</p>
        <input required type="text" placeholder="INGRESA EL NÚMERO" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs font-bold text-white placeholder-zinc-800 outline-none focus:border-red-500/50 transition" value={refNumber} onChange={(e) => setRefNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} />
        <p className="mt-1 text-[6px] text-zinc-600">Aparece al final o en el detalle de tu transferencia.</p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Seleccionar comprobante"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-black/40 p-6 hover:border-white/20 transition"
      >
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        {file && preview ? (
          <div className="w-full text-center">
            <img src={preview} alt={`Vista previa de ${file.name}`} className="mx-auto max-h-32 rounded-lg object-contain" />
            <p className="mt-2 text-[8px] font-bold text-green-400"><FileCheck className="mr-1 inline h-3 w-3" />{file.name}</p>
          </div>
        ) : file ? (
          <div className="text-center"><FileCheck className="mx-auto h-8 w-8 text-green-400" /><p className="mt-2 text-[8px] font-bold text-green-400">{file.name}</p></div>
        ) : (
          <><Upload className="mb-2 h-7 w-7 text-zinc-600" /><p className="text-[8px] font-bold text-zinc-500">SELECCIONA COMPROBANTE</p><p className="mt-1 text-[6px] text-zinc-700">JPG, JPEG O PNG — 5MB</p></>
        )}
      </div>
      <p className="text-[7px] leading-relaxed text-zinc-600">
        Puedes subir una captura o una foto clara de un depósito físico. Evita sombras, reflejos y movimiento.
      </p>

      {error && <div className="text-[9px] font-bold text-red-400 bg-red-950/40 p-3 rounded-xl"><ShieldAlert className="inline h-3 w-3 mr-1" />{error}</div>}

      <button disabled={loading || !file} type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SUBIR COMPROBANTE"}
      </button>
    </form>
  );
}
