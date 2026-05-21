"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { gsap } from "gsap";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

const initialMessages: Message[] = [
  { id: "1", sender: "bot", text: "Bienvenido a DAWGS. Soy tu AI personal. ¿En qué te puedo asistir hoy? (Eventos, Accesos, Ropa o Studio Sessions)" }
];

const quickReplies = [
  "Próximo Evento",
  "Comprar Acceso",
  "DAWGS Wear",
  "Studio Sessions",
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && chatRef.current) {
      gsap.fromTo(
        chatRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      let botReply = "Puedo ayudarte con eso. Para soporte avanzado contáctanos vía Instagram @dawgscollective.";

      const lower = text.toLowerCase();
      if (lower.includes("evento") || lower.includes("próximo") || lower.includes("next")) {
        botReply = "Nuestro próximo evento es TRAP LOUD el 31 de Octubre en Medellín. El Access Drop está disponible ahora mismo.";
      } else if (lower.includes("comprar") || lower.includes("acceso") || lower.includes("ticket") || lower.includes("access")) {
        botReply = "Puedes asegurar tu entrada directamente desde el botón 'BUY TICKET $10'. Aceptamos tarjetas y transferencias vía Kushki de forma 100% segura.";
      } else if (lower.includes("ropa") || lower.includes("wear") || lower.includes("merch")) {
        botReply = "DAWGS Wear está disponible más abajo en esta misma página. Ahora mismo tenemos la Signature Tee (Solo talla M disponible). Premium heavy cotton.";
      } else if (lower.includes("studio") || lower.includes("musica") || lower.includes("produccion")) {
        botReply = "DAWGS Studio ofrece producción, mezcla, masterización y creative sessions. Ve a la sección Studio y presiona 'Start a Project' para ir a nuestro WhatsApp directo.";
      }

      const botMsg: Message = { id: (Date.now() + 1).toString(), sender: "bot", text: botReply };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-500 hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
      >
        <Bot className="h-6 w-6 animate-pulse" />
      </button>

      {/* Interfaz de Chat */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center sm:p-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div
            ref={chatRef}
            className="relative flex h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-[30px] border border-white/10 bg-black/80 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:h-[600px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">DAWGS AI</h3>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400">Concierge</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${msg.sender === "user" ? "bg-white text-black rounded-tr-sm" : "bg-white/10 text-zinc-200 border border-white/5 rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition hover:bg-white/20 hover:text-white"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-white/10 bg-black/40 p-4">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-5 pr-2 py-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black disabled:opacity-50 disabled:bg-white/20 disabled:text-zinc-400 transition"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              </form>

              {/* Sleek branded watermark logo */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600">
                <span>DAWGS</span>
                <div className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                <span>AI CONCIERGE v1.2</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
