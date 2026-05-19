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
      {/* Luces Laser tipo concierto */}
      <div className="dawgs-lightning absolute left-[-20%] top-[20%] h-[3px] w-[150%] rotate-[-10deg] bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[2px] drop-shadow-[0_0_20px_red]" />
      <div className="dawgs-lightning absolute left-[-25%] top-[61%] h-[3px] w-[150%] rotate-[8deg] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 blur-[2px] drop-shadow-[0_0_20px_white] [animation-delay:1.1s]" />
      
      {/* Rayos Volumetricos Animados (Concert Spotlight) */}
      <div className="absolute left-[15%] top-[-10%] h-[150%] w-[50px] origin-top rotate-[35deg] bg-gradient-to-b from-red-600/60 via-red-500/10 to-transparent blur-xl opacity-80 mix-blend-screen animate-pulse [animation-duration:2s]" />
      <div className="absolute right-[20%] top-[-10%] h-[150%] w-[80px] origin-top rotate-[-25deg] bg-gradient-to-b from-red-500/40 via-red-500/5 to-transparent blur-2xl opacity-70 mix-blend-screen animate-pulse [animation-duration:3s] [animation-delay:500ms]" />
      <div className="absolute left-[40%] top-[-15%] h-[150%] w-[30px] origin-top rotate-[10deg] bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-lg opacity-60 mix-blend-screen animate-pulse [animation-duration:1.5s] [animation-delay:200ms]" />
      
      {/* Resplandores ambientales dinámicos */}
      <div className="absolute left-[50%] top-[-20%] h-[100%] w-[100%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,0,24,0.35),transparent_60%)] mix-blend-screen animate-pulse [animation-duration:4s]" />
      <div className="absolute left-[-10%] bottom-[-10%] h-[60%] w-[50%] bg-[radial-gradient(circle_at_bottom_left,rgba(255,0,24,0.15),transparent_60%)] mix-blend-screen animate-pulse [animation-duration:3.5s] [animation-delay:1s]" />
      <div className="absolute right-[-10%] bottom-[-10%] h-[60%] w-[50%] bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_60%)] mix-blend-screen animate-pulse [animation-duration:2.5s] [animation-delay:500ms]" />
      
      <div className="scanlines absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,0,0,0.04),transparent_18%,transparent_82%,rgba(255,0,0,0.04))]" />
    </div>
  );
}
