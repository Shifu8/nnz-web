"use client";

import Image from "next/image";
import { Check, Copy, QrCode, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export type TransferAccount = {
  id: string;
  bank: string;
  type: string;
  accountNumber: string;
  holder: string;
  idNumber: string;
  email: string;
  qrImage: string;
};

const money = (amount: number) => new Intl.NumberFormat("es-EC", {
  style: "currency", currency: "USD",
}).format(amount);

export default function TransferPaymentPanel({
  accounts, selectedId, onSelect, total, copiedField, onCopy, children, busy,
}: {
  accounts: TransferAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  total: number;
  copiedField: string | null;
  onCopy: (value: string, field: string) => void;
  children: ReactNode;
  busy: boolean;
}) {
  const selected = accounts.find((account) => account.id === selectedId);

  return (
    <div className="space-y-5">
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-4 flex w-full items-center gap-3 text-sm font-black uppercase tracking-wide text-zinc-900">
          Elige cómo pagar <span className="h-px flex-1 bg-zinc-200" />
        </legend>
        {accounts.map((account) => {
          const active = selectedId === account.id;
          const isDeuna = account.id === "pichincha";
          return (
            <label key={account.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-5 transition-colors focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 ${active ? "border-[#dccdff] bg-[#26143c] ring-1 ring-[#b79cda]" : "border-white/10 bg-[#180d2b] hover:bg-[#25143d]"}`}>
              <input type="radio" name="payment-method" value={account.id} checked={active} onChange={() => onSelect(account.id)} className="fourgo-payment-radio h-5 w-5 shrink-0 accent-[#dfff70]" aria-label={isDeuna ? "Pagar con Deuna" : "Pagar con Ahorita"} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-white font-black italic leading-none ${isDeuna ? "text-[36px] tracking-[-2px]" : "text-[29px] tracking-[-1px]"}`}>
                    {!isDeuna && <QrCode className="mb-1 h-6 w-6" aria-hidden="true" />}
                    {isDeuna ? "deuna!" : "ahorita!"}
                  </span>
                  {active && <Check className="h-5 w-5 text-[#dfff70]" aria-hidden="true" />}
                </span>
                <span className="mt-2 block text-xs leading-relaxed text-[#d3c6e3] sm:text-sm">
                  {isDeuna ? "Pago con QR" : "Transferencia desde la app"} · {money(total)} · <span className="text-[#dfff70]">sin recargo</span>
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {selected ? (
        <section className="overflow-hidden rounded-[24px] bg-[#180d2b] p-5 text-white shadow-[0_18px_50px_-20px_rgba(37,15,63,0.5)] sm:p-7" aria-label="Datos del pago">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[32px] font-black italic leading-none tracking-[-1px]">{selected.id === "pichincha" ? "deuna!" : "ahorita!"}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#dfff70]">Escanea y paga</p>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold">4go · USD</span>
          </div>

          <div className="mx-auto w-full max-w-[280px] rounded-[24px] bg-white p-4 shadow-[0_0_0_5px_rgba(255,255,255,0.14)]">
            <Image src={selected.qrImage} alt={`QR de pago ${selected.id === "pichincha" ? "Deuna" : "Ahorita"}`} width={280} height={280} unoptimized className="aspect-square h-auto w-full object-contain" />
          </div>
          <p className="mt-4 text-center text-xs text-[#d3c6e3]">{selected.holder}</p>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-4">
              <dt className="text-[#d3c6e3]">Monto exacto</dt>
              <dd className="text-3xl font-black tracking-tight">{money(total)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-[#d3c6e3]">Titular</dt>
              <dd className="text-right font-semibold">{selected.holder}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[#d3c6e3]">{selected.bank}</dt>
              <dd className="flex flex-wrap items-center gap-2 text-right text-xs">
                <span>{selected.type} · <span className="font-mono">{selected.accountNumber}</span></span>
                <button type="button" disabled={busy} onClick={() => onCopy(selected.accountNumber, "acc")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-white/25 px-3 text-xs font-bold hover:bg-white/10" aria-label="Copiar número de cuenta">
                  {copiedField === "acc" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "acc" ? "Copiado" : "Copiar"}
                </button>
              </dd>
            </div>
          </dl>

          <ol className="my-6 space-y-3 text-xs leading-relaxed sm:text-sm">
            {["Escanea el QR o transfiere el monto exacto.", "Guarda una captura o foto legible de tu comprobante.", "Súbelo aquí para verificar tu pago."].map((step, index) => (
              <li key={step} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dfff70] text-xs font-black text-[#180d2b]">{index + 1}</span>{step}</li>
            ))}
          </ol>
          {children}
          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] leading-relaxed text-[#d3c6e3]"><ShieldCheck className="h-4 w-4 shrink-0" />Tu comprobante se verifica antes de emitir la entrada.</p>
        </section>
      ) : <p className="text-center text-xs text-zinc-500">Selecciona Deuna o Ahorita para ver el QR y subir tu comprobante.</p>}
    </div>
  );
}
