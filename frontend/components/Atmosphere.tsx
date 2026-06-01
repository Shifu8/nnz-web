/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripcion: Atmosfera global DAWGS con textura, luces y scanlines.
 */

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#030303_0%,#0e0204_42%,#050505_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,0,24,0.18)_0%,transparent_22%,transparent_62%,rgba(200,255,0,0.055)_100%)]" />

      <div className="dawgs-signal-sweep absolute left-[-12%] top-[16%] h-32 w-[140%] rotate-[-9deg] bg-[linear-gradient(90deg,transparent,rgba(255,0,24,0.34),rgba(255,255,255,0.12),transparent)] blur-xl mix-blend-screen" />
      <div className="dawgs-signal-sweep absolute left-[-18%] top-[58%] h-24 w-[150%] rotate-[7deg] bg-[linear-gradient(90deg,transparent,rgba(200,255,0,0.13),rgba(255,255,255,0.12),transparent)] blur-xl mix-blend-screen [animation-delay:1.6s]" />

      <div className="dawgs-lightning absolute left-[-20%] top-[22%] h-[3px] w-[150%] rotate-[-10deg] bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[2px] drop-shadow-[0_0_20px_red]" />
      <div className="dawgs-lightning absolute left-[-25%] top-[63%] h-[2px] w-[150%] rotate-[8deg] bg-gradient-to-r from-transparent via-[#C8FF00] to-transparent opacity-70 blur-[2px] drop-shadow-[0_0_16px_#C8FF00] [animation-delay:1.1s]" />

      <div className="scanlines absolute inset-0 opacity-25" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.38),transparent_18%,transparent_82%,rgba(0,0,0,0.42))]" />
    </div>
  );
}
