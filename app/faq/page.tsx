"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ArrowLeft, ChevronDown } from "lucide-react";

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "¿Cómo reservo mis entradas o pases en 4GO?",
      a: "Navega por la cartelera principal, escoge tu evento favorito y presiona el botón 'RESERVAR'. Tu entrada digital se guardará automáticamente en tu perfil."
    },
    {
      q: "¿Dónde encuentro mis pases para ingresar al local?",
      a: "Tus pases están almacenados de forma permanente en la sección 'Mis Reservas' del menú superior. Presenta el código QR desde tu teléfono móvil en la entrada del evento."
    },
    {
      q: "¿Cómo publico un evento si soy organizador o discoteca?",
      a: "Ingresa a 'Trabaja con nosotrxs' o 'Partners' para registrar tu cuenta de organizador y publicar tu evento en minutos."
    },
    {
      q: "¿4GO permite la reventa ilegal de pases?",
      a: "No. En 4GO combatimos la reventa ilegal mediante códigos QR cifrados únicos para cada asistente que se verifican en la puerta del evento a precio oficial."
    }
  ];

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

      {/* Main Accordion Layout - Centered */}
      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-12">
        <div className="space-y-4 text-center max-w-2xl mx-auto border-b border-zinc-200 pb-8">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">
            Centro de Respuestas
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-zinc-950">
            PREGUNTAS FRECUENTES
          </h1>
          <p className="text-base sm:text-xl text-zinc-700 font-medium leading-relaxed pt-2">
            Respuestas simples a las dudas más comunes sobre reservas y entradas.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {faqs.map((faq, idx) => (
            <div key={`faq-${idx}`} className="border-b border-zinc-200 pb-4">
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between py-4 text-left font-extrabold text-lg sm:text-xl text-zinc-950 hover:text-zinc-600 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openIdx === idx ? "rotate-180 text-zinc-950" : "text-zinc-400"}`} />
              </button>
              {openIdx === idx && (
                <p className="text-base text-zinc-600 leading-relaxed font-normal pt-1 pb-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

