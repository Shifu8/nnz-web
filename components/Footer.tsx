"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import { Globe } from "lucide-react";

interface FooterProps {
  showTopBanner?: boolean;
  animatedScene?: boolean;
}

export default function Footer({ showTopBanner = false, animatedScene = false }: FooterProps) {
  const useCreamTheme = animatedScene || showTopBanner;

  return (
    <div className="w-full font-sans">
      {/* ─── SECTION 1: COMPRA EN SEGUNDOS (ONLY ON EVENT DETAILS) ─── */}
      {showTopBanner && (
        <section className={`${styles.banner} fourgo-event-access w-full py-16 sm:py-20 px-4 sm:px-8 border-t relative z-20 font-sans`}>
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center">
              <Image
                src="/images/lemon-relax.png"
                alt="Limón descansando entre flores"
                fill
                unoptimized
                sizes="(max-width: 640px) 160px, 176px"
                className="object-contain"
              />
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#452724] uppercase tracking-tight">
              COMPRA EN SEGUNDOS
            </h2>

            {/* Comprehensive Description */}
            <p className="text-sm sm:text-base text-[#796353] font-medium leading-relaxed max-w-xl">
              Compra tus entradas oficiales y reservas con total tranquilidad. Cada orden es validada y confirmada directamente por el organizador de cada evento, con precios 100% transparentes sin cargos ocultos y acceso digital garantizado.
            </p>
          </div>
        </section>
      )}

      {useCreamTheme && (
        <svg
          className={`${styles.divider} fourgo-footer__divider`}
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M-2 42C180 5 340 4 520 23S780 43 960 23S1270 9 1442 28"
            fill="none"
            stroke="#d7c39e"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* ─── SECTION 2: WHITE FOOTER DIRECTORY (MATCHES EXACT HOME FOOTER) ─── */}
      <footer className={`${useCreamTheme ? `fourgo-footer--night ${styles.cream}` : ""} ${useCreamTheme ? "" : "border-t"} w-full bg-white text-zinc-900 border-zinc-200 pt-8 sm:pt-10 pb-20 lg:pb-16 px-4 sm:px-8 relative z-20 overflow-hidden font-sans`}>
        {/* Background ambient lighting */}
        <div className="fourgo-footer__ambient absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-t from-[#80684d]/5 via-transparent to-transparent pointer-events-none blur-3xl" />

        <div className="max-w-[1400px] mx-auto space-y-8 sm:space-y-10 relative z-10 text-left">
          {/* ─── TOP SECTION: NAVIGATION COLUMNS ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start lg:items-center">
            {/* Brand mascot and introduction */}
            <div className="fourgo-footer__brand lg:col-span-5 lg:self-center flex items-center gap-5 sm:gap-6 h-full">
              <Image
                src="/images/4go-brand-mascot.png"
                alt="Mascota de la marca 4go"
                width={128}
                height={128}
                unoptimized
                className="fourgo-footer__mascot w-24 h-24 sm:w-32 sm:h-32 shrink-0 object-contain"
              />
              <div className="min-w-0 space-y-2">
                <p className="fourgo-footer__brand-name text-sm sm:text-base font-semibold text-zinc-700">4go · Eventos en Loja</p>
                <p className="fourgo-footer__description text-xs sm:text-sm lg:text-base text-zinc-600 font-medium max-w-md leading-relaxed">
                  Descubre los mejores eventos, conciertos y experiencias en Loja. Pases oficiales y reservas instantáneas desde tu dispositivo.
                </p>
              </div>
            </div>

            {/* Right Columns: Links (Nuestra empresa, Fan Support) */}
            <div className="fourgo-footer__links lg:col-span-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-8 max-w-xl">
              {/* Column 1: Nuestra Empresa */}
              <div className="min-w-0 space-y-3">
                <h4 className="text-xs sm:text-base font-black uppercase tracking-wider text-zinc-900">
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
              <div className="min-w-0 space-y-3">
                <h4 className="text-xs sm:text-base font-black uppercase tracking-wider text-zinc-900">
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
                  <li>
                    <a
                      href="mailto:soporte.4go@gmail.com"
                      className="hover:text-black transition-colors block break-all font-semibold text-zinc-800"
                    >
                      soporte.4go@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright, legal links and social accounts */}
          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-5 text-xs sm:text-sm text-zinc-600 font-medium">
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
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-6 text-zinc-600 text-xs sm:text-sm font-medium">
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
                    href="https://www.instagram.com/4go.ec/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-600 transition-colors p-1"
                    aria-label="Instagram 4go: @4go.ec"
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
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 w-full overflow-hidden">
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
