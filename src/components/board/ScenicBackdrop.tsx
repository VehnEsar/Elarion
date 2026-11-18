'use client';

import React from 'react';

export default function ScenicBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,#1c2436_0%,#0c1018_55%,#06080c_100%)]">
      {/* Subtelna złota poświata na horyzoncie */}
      <div className="absolute inset-x-0 top-[28%] h-72 bg-[radial-gradient(ellipse_at_center,rgba(201,158,68,0.12)_0%,rgba(56,189,248,0.05)_45%,transparent_75%)] blur-2xl" />

      {/* Delikatne punkty światła w górnej strefie nieba */}
      <svg className="absolute inset-0 h-full w-full opacity-45" preserveAspectRatio="none">
        <defs>
          <radialGradient id="mistGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="farMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e2738" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0f141e" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="midMountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#161d2b" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#0a0e16" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="mistLayer" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0" />
            <stop offset="50%" stopColor="#64748b" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#090c12" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Subtelne gwiazdy / drobiny światła */}
        <circle cx="14%" cy="16%" r="1.2" fill="#fde68a" opacity="0.6" />
        <circle cx="28%" cy="11%" r="1" fill="#7dd3fc" opacity="0.5" />
        <circle cx="42%" cy="19%" r="1.4" fill="#fde68a" opacity="0.45" />
        <circle cx="67%" cy="13%" r="1.1" fill="#fde68a" opacity="0.6" />
        <circle cx="81%" cy="21%" r="1.3" fill="#7dd3fc" opacity="0.5" />
        <circle cx="91%" cy="14%" r="1" fill="#fde68a" opacity="0.5" />

        {/* Dalekie pasmo górskie */}
        <path
          d="M 0 440 L 140 330 L 310 390 L 520 290 L 740 375 L 960 280 L 1180 365 L 1420 305 L 1680 385 L 1920 320 L 1920 1080 L 0 1080 Z"
          fill="url(#farMountain)"
        />

        {/* Warstwa mgły między pasmami */}
        <rect x="0" y="340" width="100%" height="260" fill="url(#mistLayer)" />

        {/* Bliższe pasmo górskie */}
        <path
          d="M 0 540 L 220 435 L 460 510 L 690 420 L 940 505 L 1210 430 L 1490 515 L 1760 445 L 1920 490 L 1920 1080 L 0 1080 Z"
          fill="url(#midMountain)"
        />

        {/* Dolna mgła otulająca przepaść pod płytą główną */}
        <ellipse cx="50%" cy="76%" rx="65%" ry="22%" fill="url(#mistGlow)" />
      </svg>

      {/* Płynąca mgła na pierwszym planie */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#06080c] via-[#0b1019]/75 to-transparent" />
    </div>
  );
}