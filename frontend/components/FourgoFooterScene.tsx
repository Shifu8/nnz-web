"use client";

import { useId, useRef } from "react";
import { gsap, useGSAP } from "@/frontend/animations/gsapSetup";

const equalizerBars = Array.from({ length: 37 }, (_, index) => ({
  x: 12 + index * 39,
  height: 14 + (index * 23) % 53,
}));

function PartySpeaker({ x, mirrored = false }: { x: number; mirrored?: boolean }) {
  return (
    <g transform={`translate(${x} 148) scale(${mirrored ? -1 : 1} 1) rotate(-7 38 160)`}>
      <g data-party-cabinet="">
      <path d="M0 8 76 0 89 13 92 165 15 178 3 166Z" fill="#8b6553" />
      <path d="M0 8 76 0 80 161 3 166Z" fill="#657c69" stroke="#c5d3af" strokeWidth="3" />
      <path d="M8 16 68 10 72 153 11 157Z" fill="#3c3029" />
      <g data-dj-speaker="">
        <ellipse cx="39" cy="51" rx="25" ry="27" fill="#a2765d" stroke="#e8d3a0" strokeWidth="4" />
        <ellipse cx="39" cy="51" rx="15" ry="17" fill="#5b3c31" />
        <ellipse cx="39" cy="51" rx="7" ry="8" fill="#c49a78" />
      </g>
      <g data-dj-speaker="">
        <ellipse cx="41" cy="117" rx="28" ry="30" fill="#a2765d" stroke="#e8d3a0" strokeWidth="4" />
        <ellipse cx="41" cy="117" rx="18" ry="20" fill="#5b3c31" />
        <ellipse cx="41" cy="117" rx="8" ry="9" fill="#c49a78" />
      </g>
      <path d="m-11 38 17 15-9 8 16 14m49-64-7 15 12-2-8 17" fill="none" stroke="#c7ad72" strokeWidth="4" strokeLinejoin="miter" />
      <path d="M15 173 83 163" stroke="#d9e0bc" strokeWidth="2" />
      </g>
    </g>
  );
}

function PartyDancers() {
  return (
    <>
      <g transform="translate(592 84)">
        <g data-party-dancer="">
          <path d="M-18 0q-11-29 10-35 24-7 31 18l-1 33-18 5Z" fill="#6d554a" />
          <circle cx="-15" cy="-27" r="10" fill="#9aaf91" /><circle cx="17" cy="-28" r="9" fill="#9aaf91" />
          <path d="m-6 16-1 22 18 1-5-24Z" fill="#ddb48b" />
          <g data-party-arm="left">
            <path d="m-16 42-22-28 12-30" fill="none" stroke="#e5c79b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m-28-14 2-15m-1 14 9-9" fill="none" stroke="#e5c79b" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path d="m12 44 28 31-24 25" fill="none" stroke="#e5c79b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m0 121-9 5" fill="none" stroke="#e5c79b" strokeWidth="3" strokeLinecap="round" />
          <path d="M-11 105-28 160l16 10 25-63m0 0 27 39-5 24-16-1 3-23-30-20" fill="#e5c79b" />
          <path d="m-30 159 19 6 8 13-32 2Zm48 8 21-2 10 12-31 3Z" fill="#9aaf91" />
          <path d="M-19 37 0 29l22 11 9 73-31 14-27-17Z" fill="#55715d" />
          <path d="M-6 32 6 35l11 67-24 5Z" fill="#cbd6b0" />
          <path d="m-22 48 15 14-12 13 18 15-16 14m35-59-8 9 13 13-10 10" fill="none" stroke="#e8d3a0" strokeWidth="3" />
          <path d="M-16-7q1-20 17-18 18 2 18 21L9 15Q0 25-12 10Z" fill="#ddb48b" />
          <path d="M-16-7q-1-22 16-23 14 0 18 15L2-21l-8 14Z" fill="#382b25" />
          <path d="m-14-3 12 1 1 8-10-2m14-6 12-3-2 9-10 1" fill="#382b25" stroke="#faf0d3" strokeWidth="1.6" />
          <path d="m0 4-3 5 5 1m-3 5 6-1" fill="none" stroke="#8e6252" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="-14" cy="12" r="3" fill="#a5795e" />
        </g>
      </g>
      <g transform="translate(850 101)">
        <g data-party-dancer="">
          <path d="m-12 101-18 44 13 18 19-4-10-13 25-30m2-13 14 60-20 4-18-52" fill="#6d554a" />
          <path d="m-29 152 17 7 6 12-32-2Zm40 10 24-3 8 14-34 1Z" fill="#d3ba7f" />
          <path d="M-23 37-46 69l-23 8" fill="none" stroke="#b8caa6" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m-70 75-11 1m13 4-10 5" fill="none" stroke="#b8caa6" strokeWidth="3" strokeLinecap="round" />
          <g data-party-arm="right">
            <path d="m20 37 25-25-8-28" fill="none" stroke="#b8caa6" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m37-16-7-12m8 10 2-14" fill="none" stroke="#b8caa6" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path d="M-22 31-4 24l28 13 3 73-25 11-27-15Z" fill="#b8caa6" />
          <path d="m-17 29 9 34-9 38 21 10 14-31-4-50" fill="#55715d" />
          <path d="m-2 31 18 15-6 20-13-5 7-13-10-9Z" fill="#eee0b9" />
          <path d="M-18 80 18 69l3 22-35 11Z" fill="#c7d2a4" stroke="#382b25" strokeWidth="2" />
          <path d="m-6 11-2 22q11 10 20-1l-2-19Z" fill="#a5b994" />
          <path d="M-20-9q3-23 22-20 21 3 18 24L9 15q-10 8-22-3Z" fill="#ccd3b0" />
          <path d="M-23-11q-4-27 22-28 28 0 25 31L12-21-4-17-11-5Z" fill="#382b25" />
          <path d="M-22-21q20-20 44 0" fill="none" stroke="#8b6553" strokeWidth="8" />
          <rect x="-27" y="-11" width="9" height="23" rx="4" fill="#8b6553" /><rect x="18" y="-10" width="9" height="22" rx="4" fill="#8b6553" />
          <path d="m-16-5 14 1-1 9-12-2m16-7 15-1-3 10-12-2" fill="#382b25" stroke="#e8d3a0" strokeWidth="2" />
          <path d="m-1 5-3 5 5 1m-2 5 8-1" fill="none" stroke="#677a5a" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>
    </>
  );
}

export default function FourgoFooterScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const gradientId = `fourgo-dj-${useId().replace(/:/g, "")}`;

  useGSAP(() => {
    const scene = sceneRef.current;
    if (!scene) return;

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
        gsap.fromTo("[data-party-dancer]", { rotation: -4, y: 0 }, {
          rotation: 4,
          y: -7,
          transformOrigin: "50% 90%",
          duration: (index) => 0.68 + index * 0.17,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.fromTo("[data-party-arm]", { rotation: -9 }, {
          rotation: 9,
          transformOrigin: (index) => index === 0 ? "90% 100%" : "0% 100%",
          duration: (index) => 0.68 + index * 0.17,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.fromTo("[data-party-cabinet]", { rotation: -1 }, {
          rotation: 1,
          transformOrigin: "50% 100%",
          duration: 0.68,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.fromTo("[data-party-spark]", { scale: 0.85, opacity: 0.55 }, {
          scale: 1.1,
          opacity: 1,
          transformOrigin: "50% 50%",
          duration: 1.36,
          stagger: 0.34,
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
          duration: 0.34,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        }),
        gsap.fromTo("[data-dj-led]", { opacity: 0.3 }, {
          opacity: 1,
          duration: 0.34,
          stagger: 0.085,
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

      const bounds = scene.getBoundingClientRect();
      let inView = bounds.bottom > -80 && bounds.top < window.innerHeight + 80;
      const syncPlayback = () => {
        const playing = inView && !document.hidden;
        loops.forEach((loop) => loop.paused(!playing));
      };
      const observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncPlayback();
      }, { rootMargin: "80px" });

      syncPlayback();
      observer.observe(scene);
      document.addEventListener("visibilitychange", syncPlayback);

      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", syncPlayback);
      };
    }, sceneRef);

    return () => media.revert();
  }, { scope: sceneRef });

  return (
    <div ref={sceneRef} className="fourgo-outro">
      <svg className="fourgo-outro__scene" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`${gradientId}-dots`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill="#ad9d7a" />
          </pattern>
        </defs>
        <rect x="350" y="25" width="200" height="245" fill={`url(#${gradientId}-dots)`} opacity=".35" />
        <rect x="893" y="8" width="210" height="275" fill={`url(#${gradientId}-dots)`} opacity=".65" />
        <circle cx="720" cy="204" r="136" fill="#e1d2af" opacity=".35" />
        <circle cx="720" cy="204" r="111" fill="none" stroke="#ae9673" strokeWidth="1" opacity=".2" />
        <g fill="#c5ccb3" opacity=".07">
          <path data-dj-beam="" d="M486 299 340 22 665 22Z" />
          <path data-dj-beam="" d="M954 299 775 34 1118 34Z" />
        </g>
        <g fill="#af9f7c" opacity=".25">
          {equalizerBars.map((bar) => (
            <rect key={bar.x} data-dj-eq="" x={bar.x} y={306 - bar.height} width="15" height={bar.height} rx="7" />
          ))}
        </g>
        <g fill="none" stroke="#c5ae74" strokeWidth="1.5" strokeLinecap="round" opacity=".6">
          <path d="M329 153v12m-6-6h12M1048 104v16m-8-8h16M1144 196v8m-4-4h8" />
          <circle cx="440" cy="96" r="2" fill="#d8c894" stroke="none" />
          <circle cx="970" cy="169" r="2" fill="#d8c894" stroke="none" />
        </g>

        <g data-party-spark="" fill="#e8d3a0">
          <path d="m637 33 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" />
          <path d="m800 27 3 8 9 3-9 3-3 8-3-8-8-3 8-3Z" />
        </g>
        <g data-party-spark="" fill="#6c8568">
          <path d="m542 60 10 13 15-4-8 14 8 14-15-4-10 13-1-16-14-7 14-7Z" />
          <path d="m898 49 8 17 19 2-15 13 4 19-16-10-17 10 5-19-15-13 19-2Z" />
        </g>
        <path d="M0 302c169-15 260 16 430 7 171-10 251-4 391-6 233-4 302-12 619-2v19H0Z" fill="var(--fourgo-paper, #fff5e2)" />
        <PartyDancers />
        <PartySpeaker x={502} />
        <PartySpeaker x={938} mirrored />
        <path d="M556 301q-21 22 50 8m280-8q21 22-50 8" fill="none" stroke="#9eae8d" strokeWidth="2" opacity=".6" />

        <g>
          <path d="m606 263 9 43h210l9-43Z" fill="#55715d" stroke="#dfd1a4" strokeWidth="2" />
          <path d="m615 301 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8" fill="none" stroke="#344b3b" strokeWidth="3" />
          <rect x="598" y="246" width="244" height="20" rx="7" fill="#3c3029" stroke="#cbd6b0" strokeWidth="2" />
        </g>

        <g transform="translate(655 250) scale(1 .4)">
          <g data-dj-disc="" fill="#e8d3a0" stroke="#f7edce" strokeWidth="2">
            <circle r="27" /><circle r="19" fill="none" stroke="#b6a16d" /><circle r="6" fill="#8b6553" stroke="none" />
            <circle cx="17" cy="-7" r="3.5" fill="#879c78" stroke="none" />
            <path d="M-22-7a23 23 0 0 1 20-16M19 8a21 21 0 0 1-17 13" />
          </g>
        </g>
        <g transform="translate(785 250) scale(1 .4)">
          <g data-dj-disc="" fill="#e8d3a0" stroke="#f7edce" strokeWidth="2">
            <circle r="27" /><circle r="19" fill="none" stroke="#b6a16d" /><circle r="6" fill="#8b6553" stroke="none" />
            <circle cx="17" cy="-7" r="3.5" fill="#879c78" stroke="none" />
            <path d="M-22-7a23 23 0 0 1 20-16M19 8a21 21 0 0 1-17 13" />
          </g>
        </g>
        <g stroke="#cbd6b0" strokeWidth="2" strokeLinecap="round" opacity=".7">
          <path d="M710 244v12m10-12v12m10-12v12M708 249h4m6 4h4m6-7h4" />
          <path data-dj-led="" d="M632 261h7m7 0h7" strokeWidth="3" />
          <path data-dj-led="" d="M787 261h7m7 0h7" strokeWidth="3" />
        </g>
        <path d="M674 280q46-12 92 0" fill="none" stroke="#dfd1a4" strokeWidth="2" opacity=".7" />
      </svg>
    </div>
  );
}
