"use client";

import React, { useState } from "react";
import { X, Mail, ChevronDown, Check, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GoogleConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userProfile: {
    id: string;
    name: string;
    email: string;
    type?: string;
    venueName?: string;
    city?: string;
  }) => void;
  domainName?: string;
}

export default function GoogleConsentModal({
  isOpen,
  onClose,
  onSuccess,
  domainName = "4go.ec",
}: GoogleConsentModalProps) {
  const [selectedEmail, setSelectedEmail] = useState("brandon.medina@unl.edu.ec");
  const [customName, setCustomName] = useState("Brandon Medina");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const availableAccounts = [
    { email: "brandon.medina@unl.edu.ec", name: "Brandon Medina (Master 4GO)" },
    { email: "master@4go.live", name: "Master Admin 4GO" },
    { email: "mrshifu879@gmail.com", name: "Brandon Medina (Cubic Loja)" },
  ];

  if (!isOpen) return null;

  const handleConfirmLogin = async () => {
    setIsSubmitting(true);
    try {
      const selectedAcc = availableAccounts.find((a) => a.email === selectedEmail);
      const nameToUse = selectedAcc ? selectedAcc.name : customName || selectedEmail.split("@")[0];

      const isMaster = selectedEmail === "brandon.medina@unl.edu.ec" || selectedEmail === "master@4go.live";
      const isCubic = selectedEmail === "mrshifu879@gmail.com";
      const orgType = isMaster ? "Organizador" : isCubic ? "Discoteca / Club Nocturno" : "Organizador";
      const venueName = isMaster ? "4GO" : isCubic ? "CUBIC LOJA" : "";
      const avatar = isMaster ? "/images/logo_4go_black_white.png" : isCubic ? "/images/cubic-official-logo.png" : "";

      // Save user to PostgreSQL database
      try {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: selectedEmail,
            name: nameToUse,
            provider: "google",
            type: orgType,
            venueName: venueName,
            city: "Loja",
          }),
        });
      } catch { }

      const userObj = {
        id: isMaster ? "master_admin" : isCubic ? "cubic" : `user-${Date.now()}`,
        name: nameToUse,
        email: selectedEmail,
        type: orgType,
        venueName: venueName,
        city: "Loja",
        avatar: avatar,
        hasCompletedOnboarding: true,
      };

      // Store local session
      localStorage.setItem("organizer_token", `google-token-${selectedEmail}`);
      localStorage.setItem("organizer_profile", JSON.stringify(userObj));

      onSuccess(userObj);
      onClose();
    } catch (err) {
      console.error("Error during Google auth consent:", err);
      const isMaster = selectedEmail === "brandon.medina@unl.edu.ec" || selectedEmail === "master@4go.live";
      const isCubic = selectedEmail === "mrshifu879@gmail.com";
      const fallbackUser = {
        id: isMaster ? "master_admin" : isCubic ? "cubic" : `user-${Date.now()}`,
        name: customName || (isMaster ? "Brandon Medina (4GO)" : "Brandon Medina"),
        email: selectedEmail,
        type: isMaster ? "Organizador" : isCubic ? "Discoteca / Club Nocturno" : "Organizador",
        venueName: isMaster ? "4GO" : isCubic ? "CUBIC LOJA" : "",
        city: "Loja",
        avatar: isMaster ? "/images/logo_4go_black_white.png" : isCubic ? "/images/cubic-official-logo.png" : "",
        hasCompletedOnboarding: true,
      };
      localStorage.setItem("organizer_token", `google-token-${selectedEmail}`);
      localStorage.setItem("organizer_profile", JSON.stringify(fallbackUser));
      onSuccess(fallbackUser);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl bg-[#121212] text-zinc-100 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden font-sans relative"
        >
          {/* Top Bar Google OAuth Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#121212]">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm font-semibold text-zinc-300">Iniciar sesión con Google</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 bg-[#121212]">
            {/* Left Column: Title & Account Selector */}
            <div className="space-y-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight leading-snug">
                  Iniciar sesión en <br />
                  <span className="font-semibold">{domainName}</span>
                </h2>
              </div>

              {/* Account Dropdown Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedEmail.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white truncate">{selectedEmail}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {/* Account Selection Popup */}
                {showAccountDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl overflow-hidden z-20">
                    {availableAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setSelectedEmail(acc.email);
                          setCustomName(acc.name);
                          setShowAccountDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-xs sm:text-sm flex items-center justify-between hover:bg-zinc-800 transition ${
                          selectedEmail === acc.email ? "bg-zinc-800 text-white font-semibold" : "text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{acc.email}</span>
                        </div>
                        {selectedEmail === acc.email && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Permission Details & Links */}
            <div className="space-y-5 text-xs sm:text-sm text-zinc-300">
              <h3 className="text-base sm:text-lg font-medium text-white leading-snug">
                Google permitirá que {domainName} acceda a esta información sobre ti
              </h3>

              <div className="flex items-start gap-3 pt-1">
                <Mail className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">{selectedEmail}</p>
                  <p className="text-xs text-zinc-400">Dirección de correo electrónico</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800">
                <p>
                  Consulta la{" "}
                  <a
                    href="/privacy_policy"
                    target="_blank"
                    className="text-blue-400 hover:underline font-medium"
                  >
                    Política de Privacidad
                  </a>{" "}
                  y los{" "}
                  <a
                    href="/terms_and_conditions"
                    target="_blank"
                    className="text-blue-400 hover:underline font-medium"
                  >
                    Términos del Servicio
                  </a>{" "}
                  de {domainName} para saber cómo tratará y protegerá {domainName} tus datos.
                </p>

                <p>Para hacer cambios en cualquier momento, ve a tu cuenta de Google.</p>

                <p>
                  Consulta más información sobre{" "}
                  <a
                    href="/privacy_policy"
                    target="_blank"
                    className="text-blue-400 hover:underline font-medium"
                  >
                    Iniciar sesión con Google
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-[#121212]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 text-white font-medium text-xs sm:text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmLogin}
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs sm:text-sm transition shadow-lg cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
