export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-12">
      <div className="mx-auto max-w-[1600px] w-full px-6 md:px-12 lg:px-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-black tracking-[0.3em] text-white uppercase">NOW</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
            live shows and access info
          </p>
          <p className="text-[10px] text-zinc-600 mt-4">
            &copy; {new Date().getFullYear()} NOW. All rights reserved.
          </p>

          {/* DevEc Signature */}
          <div className="mt-8 flex flex-col items-center gap-1 opacity-35 hover:opacity-85 transition-opacity duration-300 select-none">
            <span className="text-[6px] font-black tracking-[0.25em] text-zinc-600 uppercase">Desarrollado por</span>
            <div className="flex flex-col items-center">
              <svg className="h-[18px] w-auto" viewBox="0 0 110 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="25" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">Dev</text>
                <text x="41" y="25" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">E</text>
                <text x="56" y="25" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">c</text>
                {/* Waving flag tail */}
                <path d="M70 20 C78 20, 80 10, 92 10 C96 10, 98 14, 102 12" stroke="#FFDD00" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M70 23 C78 23, 80 13, 92 13 C96 13, 98 17, 102 15" stroke="#0033A0" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M70 26 C78 26, 80 16, 92 16 C96 16, 98 20, 102 18" stroke="#D52B1E" strokeWidth="2.2" strokeLinecap="round" />
                {/* Minimalist Ecuador Coat of Arms (Escudo) */}
                <path d="M 81.5,8 Q 86,10.5 90.5,8 Q 86,7 81.5,8 Z" fill="#E5C158" />
                <path d="M 83.5,10.5 C 86,9.5 86,9.5 88.5,10.5 C 88.5,13.5 87.5,16.5 86,18 C 84.5,16.5 83.5,13.5 83.5,10.5 Z" fill="#E5C158" />
                <path d="M 84.5,12 L 87.5,15" stroke="#0033A0" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
              <span className="text-[6px] font-black tracking-[0.3em] text-zinc-500 uppercase mt-0.5">
                SOFTWARE DEVELOPMENT
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
