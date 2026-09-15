"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function DeiPage() {
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
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
            Compromiso Social
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-zinc-950">
            DIVERSIDAD, EQUIDAD E INCLUSIÓN
          </h1>
          <p className="text-base sm:text-xl text-zinc-700 font-medium leading-relaxed pt-2">
            Construyendo espacios nocturnos seguros, diversos e inclusivos para todas las personas.
          </p>
        </div>



        {/* 2 Commitments Grid - Centered without cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-zinc-200 max-w-2xl w-full text-center">
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-950">Espacios Libres de Discriminación</h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
              Exigimos a todas las discotecas y recintos aliados protocolos estrictos de respeto y cero tolerancia ante cualquier acto de acoso o discriminación.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-950">Apoyo al Talento Emergente</h3>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
              Fomentamos la participación activa de colectivos culturales independientes y DJs emergentes para enriquecer la escena nocturna ecuatoriana.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

