"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function WorkPage() {
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

      {/* Main Content Layout - Centered without boxed cards */}
      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-16 text-center flex flex-col items-center">
        {/* Title & Introduction */}
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
            Oportunidades & Alianzas
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-zinc-950">
            TRABAJA CON NOSOTRXS
          </h1>
          <p className="text-base sm:text-xl text-zinc-700 font-medium leading-relaxed pt-2">
            Únete a la plataforma de entretenimiento líder en Ecuador. Conecta tus eventos, festivales o talento profesional con miles de asistentes.
          </p>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
            Trabajamos con productores, clubes, fotógrafos, diseñadores y personal de puerta que buscan elevar el estándar de las experiencias nocturnas.
          </p>
        </div>

        {/* Roles Section - Centered without boxed cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-zinc-200 max-w-2xl w-full text-center">
          <div className="space-y-4 flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Para Creadores</span>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-950 uppercase tracking-tight">Organizadores & Escenarios</h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
              Publica tus conciertos o fiestas en 4GO. Accede a herramientas de venta, control de aforo por escáner QR y liquidación transparente.
            </p>
            <div className="pt-2">
              <a
                href="mailto:soporte.nenez@gmail.com"
                className="inline-flex items-center px-6 py-3 rounded-full bg-zinc-950 text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                organizadores@4go.ec
              </a>
            </div>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Para Talento</span>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-950 uppercase tracking-tight">Staff & Colaboradores</h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
              Si eres fotógrafo, diseñador gráfico, DJ o personal operativo de eventos, envíanos tu información y portafolio.
            </p>
            <div className="pt-2">
              <a
                href="mailto:soporte.nenez@gmail.com"
                className="inline-flex items-center px-6 py-3 rounded-full bg-zinc-950 text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                empleo@4go.ec
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

