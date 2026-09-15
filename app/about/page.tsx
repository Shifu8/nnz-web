"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
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

      {/* Main Content Layout - High-End Premium Editorial */}
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24 space-y-20 text-center flex flex-col items-center">
        {/* Direct Bold Title & Subtitle */}
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span>Cultura Nocturna &amp; Eventos Oficiales</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter text-zinc-950 leading-[0.95]">
            SOBRE 4GO
          </h1>
          <p className="text-lg sm:text-2xl text-zinc-600 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
            La plataforma de descubrimiento y compra instantánea de experiencias en vivo, clubes y festivales en Ecuador.
          </p>
        </div>

        {/* Editorial Narrative Section */}
        <div className="space-y-8 max-w-2xl text-left sm:text-center text-zinc-800 leading-relaxed font-normal">
          <p className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight leading-snug">
            4GO nace de la pasión por la música en vivo y la convicción de que acceder a tus eventos favoritos debe ser un proceso simple, seguro y libre de intermediarios.
          </p>
          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
            Conectamos directamente a la comunidad de asistentes con los escenarios, discotecas y productores más representativos de Loja y el país. Mediante tecnología de acceso digital con códigos QR únicos y cifrados, garantizamos compras oficiales en segundos y eliminamos por completo el fraude y la reventa a sobreprecio.
          </p>
        </div>

        {/* 3 Core Pillars in Minimalist Clean Grid */}
        <div className="w-full pt-6 border-t border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-8 text-center max-w-4xl mx-auto">
            {/* Pillar 01 */}
            <div className="space-y-3 flex flex-col items-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                01 / Propósito
              </span>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-950">
                Nuestra Misión
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-xs font-normal">
                Empoderar a los amantes de la música con una plataforma transparente, rápida y sin cargos ocultos que respalde el crecimiento de la escena cultural local.
              </p>
            </div>

            {/* Pillar 02 */}
            <div className="space-y-3 flex flex-col items-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                02 / Tecnología
              </span>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-950">
                Acceso 100% Seguro
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-xs font-normal">
                Pases oficiales vinculados a tu cuenta y verificados en puerta con escáner de alta velocidad para un ingreso fluido y protegido contra fraudes.
              </p>
            </div>

            {/* Pillar 03 */}
            <div className="space-y-3 flex flex-col items-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                03 / Simplicidad
              </span>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-950">
                La Experiencia 4GO
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-xs font-normal">
                Explora carteleras en tiempo real, reserva en un solo toque y accede a tus entradas digitales directamente desde tu smartphone en todo momento.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Highlight Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold uppercase tracking-wider text-zinc-700">
          <span className="px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200">
            ✓ Compra en Segundos
          </span>
          <span className="px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200">
            ✓ Código QR Cifrado
          </span>
          <span className="px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200">
            ✓ Cero Reventa Ilegal
          </span>
          <span className="px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200">
            ✓ Soporte Directo
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}


