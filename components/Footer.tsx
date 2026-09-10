"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  ExternalLink,
  Music,
  ShieldCheck,
  Ticket,
} from "lucide-react";

interface FooterProps {
  showTopBanner?: boolean;
}

export default function Footer({ showTopBanner = false }: FooterProps) {
  return (
    <div className="w-full font-sans">
      {/* ─── SECTION 1: RESERVA EN SEGUNDOS (ONLY ON EVENT DETAILS) ─── */}
      {showTopBanner && (
        <section className="w-full bg-black text-white py-16 sm:py-20 px-4 sm:px-8 border-t border-white/10 relative z-20 font-sans">
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
            {/* Dark Mascot Logo */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
              <Image
                src="/images/logo_4go_vertical_eye_dark.png"
                alt="4GO"
                width={144}
                height={144}
                unoptimized
                priority
                style={{ width: "auto", height: "auto" }}
                className="object-contain"
              />
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight">
              RESERVA EN SEGUNDOS
            </h2>

            {/* Comprehensive Description */}
            <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed max-w-xl">
              Compra tus entradas oficiales y reservas con total tranquilidad. Cada orden es validada y confirmada directamente por el organizador de cada evento, con precios 100% transparentes sin cargos ocultos y acceso digital garantizado.
            </p>
          </div>
        </section>
      )}

      {/* ─── SECTION 2: WHITE FOOTER DIRECTORY (MATCHES EXACT HOME FOOTER) ─── */}
      <footer className="w-full bg-white text-zinc-900 border-t border-zinc-200 pt-16 sm:pt-20 pb-32 sm:pb-24 lg:pb-16 px-4 sm:px-8 relative z-20 overflow-hidden font-sans">
        {/* Background ambient lighting */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent pointer-events-none blur-3xl" />

        <div className="max-w-[1400px] mx-auto space-y-16 relative z-10 text-left">
          {/* ─── TOP SECTION: NAVIGATION COLUMNS ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start lg:items-center">
            {/* Left Column: Logo + Description */}
            <div className="lg:col-span-5 lg:self-center flex items-center gap-5 sm:gap-6 h-full">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                <Image
                  src="/images/logo_4go_black_white.png"
                  alt="4GO Logo"
                  width={96}
                  height={96}
                  unoptimized
                  priority
                  style={{ width: "auto", height: "auto" }}
                  className="object-contain"
                />
              </div>
              <p className="text-sm sm:text-base text-zinc-600 font-medium max-w-md leading-relaxed">
                Descubre los mejores eventos, conciertos y experiencias en Loja. Pases oficiales y reservas instantáneas desde tu dispositivo.
              </p>
            </div>

            {/* Right Columns: Links (Nuestra empresa, Fan Support, Recursos) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 pt-2">
              {/* Column 1: Nuestra Empresa */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-black uppercase tracking-widest text-zinc-900">
                  Nuestra empresa
                </h4>
                <ul className="space-y-3 text-xs sm:text-sm text-zinc-600 font-medium">
                  <li>
                    <Link href="/about" className="hover:text-black transition-colors block">
                      Sobre 4GO
                    </Link>
                  </li>
                  <li>
                    <Link href="/work" className="hover:text-black transition-colors block">
                      Trabaja con nosotrxs
                    </Link>
                  </li>
                  <li>
                    <Link href="/dei" className="hover:text-black transition-colors block">
                      Diversidad, Equidad e Inclusión
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Fan Support */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-black uppercase tracking-widest text-zinc-900">
                  Fan Support
                </h4>
                <ul className="space-y-3 text-xs sm:text-sm text-zinc-600 font-medium">
                  <li>
                    <Link href="/help" className="hover:text-black transition-colors block">
                      Recibir ayuda
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-black transition-colors block">
                      Preguntas frecuentes
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Recursos */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-black uppercase tracking-widest text-zinc-900">
                  Recursos
                </h4>
                <ul className="space-y-3 text-xs sm:text-sm text-zinc-600 font-medium">
                  <li>
                    <Link href="/venues" className="hover:text-black transition-colors block">
                      Salas
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-black transition-colors block">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/partners" className="hover:text-black transition-colors inline-flex items-center gap-1.5">
                      Partners <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ─── MIDDLE DIVIDER & SUB-FOOTER ROW (CENTERED & LARGER) ─── */}
          <div className="border-t border-zinc-200 pt-10 space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-xs sm:text-sm text-zinc-600 font-medium">
              {/* Left: Copyright & Language */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span className="text-zinc-700 font-semibold text-xs sm:text-sm">
                  © {new Date().getFullYear()} 4GO Events Ltd.
                </span>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-zinc-200 hover:border-zinc-300 transition cursor-pointer text-xs sm:text-sm font-semibold"
                >
                  <Globe className="w-4 h-4 text-zinc-700" />
                  <span>Español</span>
                </button>
              </div>

              {/* Middle: Legal / Policy Links & Social Icons */}
              <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-zinc-600 text-xs sm:text-sm font-medium">
                <a href="/privacy_policy" className="hover:text-black transition-colors">
                  Política de Privacidad
                </a>
                <a href="/terms_and_conditions" className="hover:text-black transition-colors">
                  Términos y Condiciones
                </a>
                <a href="/ticket_reservation_terms" className="hover:text-black transition-colors">
                  Condiciones de Reserva
                </a>
                <a href="/cookie_settings" className="hover:text-black transition-colors">
                  Configuración de cookies
                </a>

                {/* Social Icons: Instagram, TikTok & YouTube */}
                <div className="flex items-center gap-3.5 text-zinc-700 shrink-0 ml-1">
                  <a
                    href="https://www.instagram.com/4gooooooooo?igsi=cmF5bGJqMXZoeDBl&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-600 transition-colors p-1"
                    aria-label="Instagram 4GO"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>

                  <a
                    href="https://www.tiktok.com/@4goooooo?_r=1&_t=ZS-998RKwceEAH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black transition-colors p-1"
                    aria-label="TikTok 4GO"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525 0h3.08c.12 1.05.7 2.05 1.6 2.7 1.1.8 2.4 1.2 3.8 1.2v3.1c-1.4 0-2.8-.4-4-1.1v8.5c0 4.7-3.8 8.5-8.5 8.5S0 19.1 0 14.4c0-4.7 3.8-8.5 8.5-8.5 1 0 2 .2 2.9.5v3.3c-.9-.5-1.9-.8-2.9-.8-2.9 0-5.3 2.4-5.3 5.3s2.4 5.3 5.3 5.3 5.3-2.4 5.3-5.3V0z"/>
                    </svg>
                  </a>

                  <a
                    href="https://www.youtube.com/channel/UC233wg6Lfn6GOxUspsbE6ww"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-600 transition-colors p-1"
                    aria-label="YouTube 4GO"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright & Inline Compact DevEc Branding */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200/60 w-full overflow-hidden">
              <p className="text-xs sm:text-sm text-zinc-500 text-center lg:text-left font-medium max-w-xl">
                4GO y el logo de 4GO son marcas registradas de 4GO Events Ltd. Todos los derechos reservados.
              </p>

              {/* Compact DevEc Branding Inline next to Copyright */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-zinc-500 shrink-0 select-none group transition-transform duration-300 hover:scale-105 max-w-full px-2">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                  DESARROLLADO POR
                </span>
                <svg
                  className="h-5 sm:h-6 w-auto shrink-0"
                  viewBox="0 0 220 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <text
                    x="10"
                    y="36"
                    fill="#000000"
                    fontSize="34"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="-0.03em"
                  >
                    Dev
                  </text>
                  <text
                    x="76"
                    y="36"
                    fill="#000000"
                    fontSize="34"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="-0.03em"
                  >
                    E
                  </text>
                  <text
                    x="98"
                    y="36"
                    fill="#000000"
                    fontSize="34"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="-0.03em"
                  >
                    c
                  </text>
                  <path
                    d="M120 20 C135 20, 142 10, 162 10 C182 10, 190 18, 205 15"
                    stroke="#FFDD00"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M120 26 C135 26, 142 16, 162 16 C182 16, 190 24, 205 21"
                    stroke="#0033A0"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M120 32 C135 32, 142 22, 162 22 C182 22, 190 30, 205 27"
                    stroke="#D52B1E"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                  SOFTWARE DEVELOPMENT
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
