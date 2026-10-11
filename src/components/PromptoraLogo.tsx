import React from 'react';

interface PromptoraLogoProps {
  variant?: 'header' | 'hero' | 'compact' | 'icon-only';
  showTagline?: boolean;
  showCreatedBy?: boolean;
  className?: string;
}

export const PromptoraIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 flex items-center justify-center select-none ${className}`}
    >
      {/* Ambient Neon Purple/Blue Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 opacity-60 blur-md" />

      {/* SVG Icon matching the uploaded Promptora branding */}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full relative z-10 drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e1052" />
            <stop offset="100%" stopColor="#0f0521" />
          </linearGradient>

          <linearGradient id="pRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#f472b6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="pBody" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="85%" stopColor="#c7d2fe" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>

          <linearGradient id="pStemFold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>

          <linearGradient id="pNozzle" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <radialGradient id="pRecDot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>
        </defs>

        {/* Squircle Tile */}
        <rect
          x="56"
          y="56"
          width="400"
          height="400"
          rx="96"
          ry="96"
          fill="url(#pGlass)"
          stroke="url(#pRim)"
          strokeWidth="6"
        />

        {/* Camera Lens Triangle */}
        <polygon points="340,165 390,130 390,230 340,195" fill="url(#pNozzle)" />

        {/* Stylized P Body */}
        <g>
          <path
            d="M 190 115 L 285 115 C 345 115 365 155 365 200 C 365 245 340 280 280 280 L 235 280 C 215 280 195 295 190 320 L 175 385 C 170 405 150 410 135 395 C 120 380 125 355 130 330 L 165 160 C 170 130 180 115 190 115 Z"
            fill="url(#pBody)"
          />
          {/* Fold shading */}
          <path
            d="M 130 330 C 125 355 120 380 135 395 C 150 410 170 405 175 385 L 190 320 C 195 295 215 280 235 280 L 185 280 C 155 280 135 305 130 330 Z"
            fill="url(#pStemFold)"
          />
          {/* Inner Cutout */}
          <path
            d="M 215 160 L 270 160 C 305 160 315 180 315 200 C 315 220 300 238 270 238 L 215 238 Z"
            fill="#100522"
          />
          {/* 3 Prompter Lines */}
          <rect x="228" y="174" width="60" height="9" rx="4.5" fill="#38bdf8" />
          <rect x="228" y="193" width="76" height="9" rx="4.5" fill="#38bdf8" />
          <rect x="228" y="212" width="48" height="9" rx="4.5" fill="#38bdf8" />
        </g>

        {/* Glowing Red Camera Recording Indicator Button */}
        <circle cx="330" cy="335" r="38" fill="none" stroke="#ffffff" strokeWidth="6" />
        <circle cx="330" cy="335" r="26" fill="url(#pRecDot)" />
      </svg>
    </div>
  );
};

export const PromptoraLogo: React.FC<PromptoraLogoProps> = ({
  variant = 'header',
  showTagline = true,
  showCreatedBy = true,
  className = '',
}) => {
  if (variant === 'icon-only') {
    return <PromptoraIcon size={44} className={className} />;
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center space-y-4 select-none ${className}`}>
        {/* Big Glow Icon */}
        <div className="relative">
          <PromptoraIcon size={120} />
          {/* Floor illumination reflection */}
          <div className="w-32 h-3 mx-auto mt-2 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 blur-sm" />
        </div>

        {/* Wordmark */}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight flex items-center justify-center text-white">
            <span>Prompt</span>
            <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              ora
            </span>
          </h1>

          {showTagline && (
            <p className="text-xs sm:text-sm font-medium tracking-widest text-slate-300 uppercase">
              Read Naturally. Record Confidently.
            </p>
          )}

          {showCreatedBy && (
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Created by</span>
              <span className="text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                Alakh
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Header / Compact Default
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <PromptoraIcon size={38} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-white flex items-center">
            <span>Prompt</span>
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              ora
            </span>
          </span>
          {showCreatedBy && (
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded-md">
              by Alakh
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[10px] text-slate-400 tracking-wider">
            Read Naturally. Record Confidently.
          </span>
        )}
      </div>
    </div>
  );
};
