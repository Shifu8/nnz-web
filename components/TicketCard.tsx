"use client";

import type { Ticket } from "@/types";

interface Props {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: Props) {
  const statusColors: Record<string, string> = {
    valid: "text-green-400 border-green-500/30 bg-green-950/30",
    used: "text-zinc-500 border-zinc-700/30 bg-zinc-950/30",
    revoked: "text-red-400 border-red-500/30 bg-red-950/30",
  };

  return (
    <div className="w-full max-w-md rounded-[32px] border border-zinc-800 bg-[#070707] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
        <span className="text-[8px] font-black tracking-[0.25em] text-[#C8FF00] uppercase">
          DAWGS VIP ACCESS
        </span>
        <span className={`text-[7px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColors[ticket.status] || statusColors.valid}`}>
          {ticket.status}
        </span>
      </div>

      <div className="flex justify-center mb-4">
        {ticket.qrCode ? (
          <img src={ticket.qrCode} alt="QR" className="w-44 h-44 rounded-2xl" />
        ) : (
          <div className="w-44 h-44 bg-zinc-900 rounded-2xl flex items-center justify-center">
            <span className="text-[8px] text-zinc-600 uppercase tracking-widest">Sin QR</span>
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-white font-bold text-sm">{ticket.firstName} {ticket.lastName}</p>
        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">
          {ticket.ticketCode}
        </p>
        <p className="text-[8px] text-zinc-600 uppercase tracking-wider">
          {ticket.eventId} &middot; {new Date(ticket.createdAt).toLocaleDateString("es-EC")}
        </p>
      </div>
    </div>
  );
}
