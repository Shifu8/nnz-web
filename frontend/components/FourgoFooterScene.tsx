"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

const equalizerBars = Array.from({ length: 37 }, (_, index) => ({
  x: 12 + index * 39,
  height: 14 + (index * 23) % 53,
}));

export default function FourgoFooterScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useGSAP(() => {
    const scene = sceneRef.current;
    if (!scene || paused) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const loops = [
        gsap.to("[data-dj-disc]", {
          rotation: 360,
          transformOrigin: "50% 50%",
          duration: 3.6,
          ease: "none",
          repeat: -1,
          paused: true,
        }),
        gsap.fromTo("[data-dj-head]", { rotation: -3 }, {
          rotation: 3,
          transformOrigin: "50% 90%",
          duration: 0.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.to("[data-dj-arm]", {
          rotation: 7,
          svgOrigin: "740 201",
          duration: 0.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.to("[data-dj-eq]", {
          scaleY: (index) => 0.2 + (index % 4) * 0.12,
          transformOrigin: "50% 100%",
          duration: (index) => 0.45 + (index % 5) * 0.14,
          stagger: 0.035,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.to("[data-dj-speaker]", {
          scale: 1.07,
          transformOrigin: "50% 50%",
          duration: 0.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.fromTo("[data-dj-beam]", { rotation: -8 }, {
          rotation: 8,
          transformOrigin: "50% 100%",
          duration: 5,
          stagger: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
      ];

      let inView = false;
      const syncPlayback = () => {
        const playing = inView && !document.hidden;
        loops.forEach((loop) => loop.paused(!playing));
      };
      const observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncPlayback();
      }, { rootMargin: "80px" });

      observer.observe(scene);
      document.addEventListener("visibilitychange", syncPlayback);

      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", syncPlayback);
      };
    }, sceneRef);

    return () => media.revert();
  }, { scope: sceneRef, dependencies: [paused], revertOnUpdate: true });

  return (
    <div ref={sceneRef} className="fourgo-outro">
      <svg className="fourgo-outro__scene" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <circle cx="720" cy="274" r="136" fill="#ffe4b6" opacity=".22" />
        <g fill="#fff4d3" opacity=".12">
          <path data-dj-beam="" d="M486 299 340 22 665 22Z" />
          <path data-dj-beam="" d="M954 299 775 34 1118 34Z" />
        </g>
        <g fill="#45204f" opacity=".28">
          {equalizerBars.map((bar) => (
            <rect key={bar.x} data-dj-eq="" x={bar.x} y={306 - bar.height} width="15" height={bar.height} rx="7" />
          ))}
        </g>
        <g fill="none" stroke="#fff7dc" strokeWidth="1.5" strokeLinecap="round" opacity=".6">
          <path d="M329 153v12m-6-6h12M1048 104v16m-8-8h16M1144 196v8m-4-4h8" />
          <circle cx="440" cy="96" r="2" fill="#fff7dc" stroke="none" />
          <circle cx="970" cy="169" r="2" fill="#fff7dc" stroke="none" />
        </g>

        <g fill="#170d29">
          <path d="M0 291c169-15 260 24 430 15 171-10 251-4 391-6 233-4 302-21 619-7v27H0Z" />
          <rect x="461" y="219" width="69" height="89" rx="6" />
          <rect x="910" y="219" width="69" height="89" rx="6" />
        </g>
        <g fill="none" stroke="#b7a0ca" strokeWidth="1.4">
          <circle cx="495.5" cy="239" r="8" opacity=".5" />
          <circle cx="944.5" cy="239" r="8" opacity=".5" />
          <g data-dj-speaker=""><circle cx="495.5" cy="276" r="22" opacity=".45" /><circle cx="495.5" cy="276" r="12" opacity=".2" /></g>
          <g data-dj-speaker=""><circle cx="944.5" cy="276" r="22" opacity=".45" /><circle cx="944.5" cy="276" r="12" opacity=".2" /></g>
        </g>

        <g data-alien-dj="" fill="#170d29">
          <path d="M712 181v23h16v-23Z" fill="#a4d747" />
          <path d="M701 199q19-14 38 0l11 53h-60Z" fill="#f6f2da" />
          <path d="m701 202-24 17-10-34 14-19" fill="none" stroke="#b8e85a" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <g data-dj-arm="">
            <path d="M740 201q29 12 29 23l-25 21" fill="none" stroke="#b8e85a" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M743 240v11m5-15v12m-10-7v8" fill="none" stroke="#b8e85a" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <g data-dj-head="">
            <path d="M687 146c-3-24 10-37 33-37s36 13 33 37c-2 19-20 40-33 48-13-8-31-29-33-48Z" fill="#b8e85a" stroke="#91c23d" strokeWidth="1.5" />
            <path d="M685 151c-7-35 8-49 33-49 26-1 45 14 42 46" fill="none" stroke="#170d29" strokeWidth="7" strokeLinecap="round" />
            <rect x="679" y="145" width="12" height="30" rx="6" />
            <rect x="751" y="143" width="12" height="30" rx="6" />
            <path d="M684 151v17m74-19v17" fill="none" stroke="#dfff70" strokeWidth="2" strokeLinecap="round" opacity=".75" />
            <g fill="#170d29" stroke="#fffbea" strokeWidth="2.5">
              <path d="M696 136c12 1 20 13 19 23-12 1-21-10-19-23Z" />
              <path d="M744 136c-12 1-20 13-19 23 12 1 21-10 19-23Z" />
              <path d="M715 146q5-3 10 0" fill="none" />
            </g>
            <path d="M715 176q5 3 10 0" fill="none" stroke="#456c27" strokeWidth="2" strokeLinecap="round" />
            <circle cx="717.5" cy="166" r="1" fill="#456c27" />
            <circle cx="722.5" cy="166" r="1" fill="#456c27" />
          </g>

          <rect x="598" y="246" width="244" height="20" rx="7" />
          <path d="m606 263 9 43h210l9-43Z" />
        </g>
        <g transform="translate(655 250) scale(1 .4)">
          <g data-dj-disc="" fill="none" stroke="#d6c0e5" strokeWidth="2">
            <circle r="27" opacity=".7" /><circle r="19" opacity=".25" /><circle r="5" fill="#dfff70" stroke="none" />
            <path d="M-22-7a23 23 0 0 1 20-16M19 8a21 21 0 0 1-17 13" />
          </g>
        </g>
        <g transform="translate(785 250) scale(1 .4)">
          <g data-dj-disc="" fill="none" stroke="#d6c0e5" strokeWidth="2">
            <circle r="27" opacity=".7" /><circle r="19" opacity=".25" /><circle r="5" fill="#dfff70" stroke="none" />
            <path d="M-22-7a23 23 0 0 1 20-16M19 8a21 21 0 0 1-17 13" />
          </g>
        </g>
        <g stroke="#dfff70" strokeWidth="2" strokeLinecap="round" opacity=".7">
          <path d="M710 244v12m10-12v12m10-12v12M708 249h4m6 4h4m6-7h4" />
          <path d="M632 261h7m7 0h7m134 0h7m7 0h7" strokeWidth="3" />
        </g>
        <path d="M678 289q42-11 84 0" fill="none" stroke="#dfff70" strokeWidth="1.5" opacity=".4" />
      </svg>
      <button type="button" className="fourgo-outro__toggle" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Reproducir animación del DJ" : "Pausar animación del DJ"}>
        {paused ? <Play size={12} /> : <Pause size={12} />}
        <span>{paused ? "Reproducir" : "Pausar"}</span>
      </button>
    </div>
  );
}
