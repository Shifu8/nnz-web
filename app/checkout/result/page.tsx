"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert, ShieldCheck, MessageCircle, Home } from "lucide-react";
import PartyPass from "@/frontend/features/access-drop/PartyPass";
import {
  saveRecoveryToken,
  saveTicketPass,
  loadTicketPass,
  clearTicketPass,
} from "@/lib/persistence/clientState";

type PassData = {
  firstName: string;
  lastName: string;
  serialNumber: string;
  qrPayload: string;
};

function CheckoutResultInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "cancelled">("loading");
  const [message, setMessage] = useState("");
  const [passData, setPassData] = useState<PassData | null>(null);
  const [waLink, setWaLink] = useState("");

  const goHome = useCallback(() => {
    clearTicketPass();
    router.push("/#access");
  }, [router]);

  useEffect(() => {
    const saved = loadTicketPass();
    if (saved?.qrPayload) {
      setPassData(saved);
      setWaLink(saved.waLink || "");
      setMessage("Tu acceso fue confirmado.");
      setStatus("success");
      return;
    }

    const cancelled = searchParams.get("cancelled");
    if (cancelled) {
      setStatus("cancelled");
      setMessage("Pago cancelado. Puedes intentar de nuevo.");
      return;
    }

    const isDemo = searchParams.get("demo") === "1";
    const id = Number(searchParams.get("id") || 0);
    const clientTransactionId = searchParams.get("clientTransactionId") || "";

    if (!clientTransactionId) {
      setStatus("error");
      setMessage("Respuesta de pago incompleta.");
      return;
    }

    if (!isDemo && !id) {
      setStatus("error");
      setMessage("Respuesta de PayPhone incompleta.");
      return;
    }

    let active = true;

    async function confirm() {
      try {
        const endpoint = isDemo ? "/api/payphone/demo-complete" : "/api/payphone/confirm";
        const body = isDemo
          ? { clientTransactionId }
          : { id, clientTransactionId };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!active) return;

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "No se pudo confirmar el pago.");
          return;
        }

        setPassData(data.pass);
        setWaLink(data.waLink || "");

        const deliveryNote =
          data.delivery && !data.delivery.success
            ? ` Ticket OK. Envío: ${(data.delivery.warnings || []).join(" ")}`
            : "";
        setMessage((data.message || "Tu acceso fue enviado correctamente") + deliveryNote);
        setStatus("success");
        saveRecoveryToken(clientTransactionId);
        if (data.pass) {
          saveTicketPass({
            ...data.pass,
            transactionId: clientTransactionId,
            waLink: data.waLink || "",
          });
        }
      } catch {
        if (!active) return;
        setStatus("error");
        setMessage("Error de red al confirmar el pago.");
      }
    }

    confirm();
    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white flex flex-col items-center justify-center">
      {status === "loading" && (
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#C8FF00]" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
            Confirmando pago...
          </p>
        </div>
      )}

      {status === "success" && passData && (
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-6 flex items-center gap-2 text-[#C8FF00]">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{message}</p>
          </div>
          <PartyPass data={passData} />

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-[#C8FF00]/40 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#C8FF00] hover:bg-[#C8FF00]/10"
            >
              <MessageCircle className="h-5 w-5" />
              RECIBIR QR POR WHATSAPP
            </a>
          )}

          <button
            onClick={goHome}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8FF00] py-4 text-xs font-black uppercase tracking-[0.2em] text-black"
          >
            <Home className="h-4 w-4" />
            VOLVER AL EVENTO
          </button>
        </div>
      )}

      {(status === "error" || status === "cancelled") && (
        <div className="w-full max-w-md text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm font-bold text-red-400">{message}</p>
          <button
            onClick={() => router.push("/#access")}
            className="mt-8 inline-block w-full rounded-xl border border-white/20 py-4 text-xs font-black uppercase tracking-[0.2em]"
          >
            VOLVER AL EVENTO
          </button>
        </div>
      )}
    </main>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black flex items-center justify-center text-white">
          <Loader2 className="h-10 w-10 animate-spin text-[#C8FF00]" />
        </main>
      }
    >
      <CheckoutResultInner />
    </Suspense>
  );
}
