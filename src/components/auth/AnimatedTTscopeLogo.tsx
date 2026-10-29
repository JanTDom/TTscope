"use client";

import { useEffect, useState } from "react";

export function AnimatedTTscopeLogo({ className = "" }: { className?: string }) {
  const [isSmiling, setIsSmiling] = useState(false);

  useEffect(() => {
    // Cykliczny uśmiech: co 3 sekundy uśmiecha się na 2.5 sekundy
    const interval = setInterval(() => {
      setIsSmiling((prev) => !prev);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes headGesture {
          0% {
            transform: rotate(0deg) translateY(0px) scale(1);
          }
          20% {
            transform: rotate(-2.5deg) translateY(-2px) scale(1.015);
          }
          50% {
            transform: rotate(2deg) translateY(-3px) scale(1.02);
          }
          75% {
            transform: rotate(-1deg) translateY(-1px) scale(1.01);
          }
          100% {
            transform: rotate(0deg) translateY(0px) scale(1);
          }
        }
        @keyframes glassGlint {
          0%, 65% {
            opacity: 0;
            transform: translateX(-40px) skewX(-25deg);
          }
          70% {
            opacity: 0.9;
          }
          85% {
            opacity: 0;
            transform: translateX(120px) skewX(-25deg);
          }
          100% {
            opacity: 0;
            transform: translateX(120px) skewX(-25deg);
          }
        }
        .anim-head-sway {
          transform-origin: 22% 65%;
          animation: headGesture 6.4s ease-in-out infinite;
        }
        .anim-glint {
          animation: glassGlint 6.4s ease-in-out infinite;
        }
        .radar-sweep-beam {
          transform-origin: 22.5% 48%;
          animation: radarSweep 8s linear infinite;
        }
      `}</style>

      {/* Kontener logo w proporcjach 2:1 (1024x512) */}
      <div className="relative w-full max-w-xl aspect-[2/1] rounded-2xl p-2">
        {/* Poświata neonowa pod radarem i postacią */}
        <div className="absolute left-[5%] top-[10%] w-[38%] aspect-square bg-cyan-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Dynamiczny promień skanowania radaru w tle za postacią */}
        <svg
          viewBox="0 0 1024 512"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        >
          <g className="radar-sweep-beam">
            <line
              x1="230"
              y1="245"
              x2="480"
              y2="100"
              stroke="rgba(0, 229, 255, 0.4)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M230 245 L480 100 A250 250 0 0 1 450 360 Z"
              fill="url(#radarGradient)"
              opacity="0.25"
            />
          </g>
          <defs>
            <radialGradient id="radarGradient" cx="230" cy="245" r="250" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Warstwa postaci i głowy — animowany ruch głowy (anim-head-sway) */}
        <div className="relative w-full h-full anim-head-sway z-10">
          {/* 1. Obraz bazowy (postać z neutralnym wyrazem) */}
          <img
            src="/ttscope-logo.png"
            alt="TTscope Logo"
            className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,229,255,0.25)] transition-opacity duration-700 ease-in-out"
            style={{ opacity: isSmiling ? 0 : 1 }}
          />

          {/* 2. Obraz uśmiechnięty (postać z promiennym, szerokim uśmiechem) */}
          <img
            src="/ttscope-logo-smiling.png"
            alt="TTscope Logo Smiling"
            className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(0,229,255,0.45)] transition-opacity duration-700 ease-in-out"
            style={{ opacity: isSmiling ? 1 : 0 }}
          />

          {/* 3. Błysk w okularach faceta w momencie uśmiechu */}
          <div
            className="absolute left-[16%] top-[33%] w-[15%] h-[10%] overflow-hidden pointer-events-none rounded-lg"
            style={{ clipPath: "polygon(0 15%, 100% 15%, 95% 85%, 5% 85%)" }}
          >
            <div className="w-8 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent anim-glint" />
          </div>

          {/* 4. Subtelny blik w drugim szkle */}
          <div
            className="absolute left-[24%] top-[33%] w-[9%] h-[10%] overflow-hidden pointer-events-none rounded-lg"
            style={{ clipPath: "polygon(0 15%, 100% 15%, 95% 85%, 5% 85%)" }}
          >
            <div className="w-8 h-full bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent anim-glint" />
          </div>
        </div>

        {/* Sygnalizator gotowości pod radarem */}
        <div className="absolute left-[21%] bottom-[6%] -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 backdrop-blur-md z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>RADAR AKTYWNY</span>
        </div>
      </div>
    </div>
  );
}
