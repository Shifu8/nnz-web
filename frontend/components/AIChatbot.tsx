"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { X, Send, Bot } from "lucide-react";
import { gsap } from "gsap";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "bot",
    text: "Hola, que tal. Bienvenido a DAWGS. Soy tu concierge del evento: entradas y soporte. Que necesitas?",
  },
];

const quickReplies = [
  "Proximo Evento",
  "Comprar Acceso",
  "Contacto",
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

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: crypto.randomUUID(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    const thinkingId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: thinkingId, sender: "bot", text: "..." }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ sender, text }) => ({ sender, text })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "No se que decir.";

      setMessages((prev) => prev.map((m) => (m.id === thinkingId ? { ...m, text: reply } : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId ? { ...m, text: "Hubo un error. Intenta de nuevo." } : m,
        ),
      );
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full border border-pink-300/30 bg-pink-500/20 text-pink-300 shadow-[0_0_30px_rgba(236,72,153,0.2)] backdrop-blur-xl transition-all duration-500 hover:bg-pink-500/30 hover:shadow-[0_0_40px_rgba(236,72,153,0.3)] ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        style={{ width: "56px", height: "56px", position: "fixed" } as CSSProperties}
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/20 border border-pink-300/30 text-pink-300">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">DAWGS AI</h3>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400">Concierge</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-400 backdrop-blur-xl transition hover:border-pink-300/30 hover:bg-pink-500/20 hover:text-pink-300"
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
                  className="glass-action glass-action-quiet shrink-0 text-zinc-200"
                  style={{ "--glass-action-height": "34px", "--glass-action-px": "1rem", "--glass-action-text": "0.58rem" } as CSSProperties}
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
                  className="glass-icon-button glass-action-lime"
                  style={{ "--glass-icon-size": "40px" } as CSSProperties}
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              </form>

              {/* Sleek branded watermark logo */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600">
                <span>DAWGS</span>
                <div className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                <span>AI CONCIERGE v2.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
