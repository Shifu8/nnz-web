/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Capas visuales de partÃ­culas, humo, rayos y scanlines.
 */

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(229,9,20,0.30),transparent_34%),radial-gradient(circle_at_8%_68%,rgba(255,255,255,0.07),transparent_24%),linear-gradient(180deg,#040404,#120205_48%,#050505)]" />
      <div className="dawgs-particles absolute inset-0" />
      <div className="dawgs-smoke absolute -left-28 top-24 h-80 w-[34rem] rounded-full bg-red-500/10 blur-3xl" />
      <div className="dawgs-smoke absolute -right-32 bottom-10 h-96 w-[38rem] rounded-full bg-white/5 blur-3xl [animation-delay:2s]" />
      <div className="dawgs-lightning absolute left-[-20%] top-[20%] h-px w-[150%] rotate-[-10deg] bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[2px]" />
      <div className="dawgs-lightning absolute left-[-25%] top-[61%] h-px w-[150%] rotate-[8deg] bg-gradient-to-r from-transparent via-white to-transparent opacity-60 blur-[1px] [animation-delay:1.1s]" />
      <div className="scanlines absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,0,0,0.04),transparent_18%,transparent_82%,rgba(255,0,0,0.04))]" />
    </div>
  );
}
