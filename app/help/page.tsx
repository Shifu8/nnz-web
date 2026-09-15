"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft, Mail } from "lucide-react";

export default function HelpPage() {
  const [supportEmail, setSupportEmail] = useState("soporte.nenez@gmail.com");

  useEffect(() => {
    fetch("/api/homepage-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.footer?.email) {
          setSupportEmail(data.config.footer.email);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full border-b border-zinc-200 py-5 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-900 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a 4GO</span>
        </Link>
        <Link href="/" className="relative w-10 h-10 shrink-0">
          <Image
            src="/images/logo_4go_black_white.png"
            alt="4GO Logo"
            fill
            className="object-contain rounded-xl"
          />
        </Link>
      </header>

      {/* Main Support Portal Layout - Fully Centered without boxed cards */}
      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-12 text-center flex flex-col items-center">
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
            Atención al Cliente 24/7
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-zinc-950">
            RECIBIR AYUDA
          </h1>
          <p className="text-base sm:text-xl text-zinc-600 font-medium leading-relaxed pt-2">
            Estamos aquí para acompañarte a gestionar tus pases, resolver cualquier duda sobre tus entradas o brindarte asistencia de acceso.
          </p>
        </div>

        {/* Centered Email Contact Action without card/box wrapper */}
        <div className="space-y-6 max-w-lg pt-4 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm">
            <Mail className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 uppercase tracking-tight">
              Soporte por Correo
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
              Escríbenos para consultas sobre la reserva de tu pase, confirmación de cuenta, aclaraciones de pago o asistencia técnica.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-950 text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              <span>{supportEmail}</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


