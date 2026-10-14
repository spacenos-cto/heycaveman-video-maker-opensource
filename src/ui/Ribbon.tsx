// The inflatable blue ribbon (devpost/prd.md > Look and Feel v4): one thick tube drawn as layered strokes
// (shadow, body, soft highlight, glint) with a grainy surface, so it reads as 3D without any gradient
// image. It draws itself in once and then drifts very slowly.
const PATHS = {
  hero: 'M-160 760 C 80 420, 300 120, 560 240 S 760 820, 1040 700 S 1300 80, 1620 260',
  band: 'M-80 220 C 260 40, 520 360, 800 200 S 1260 20, 1540 180',
};

import { memo } from 'react';

export const Ribbon = memo(function Ribbon({ variant = 'hero', className = '' }: { variant?: keyof typeof PATHS; className?: string }) {
  const d = PATHS[variant];
  const w = variant === 'hero' ? 210 : 120;
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className={`ribbon pointer-events-none overflow-visible [will-change:transform] animate-[drift_24s_ease-in-out_infinite_alternate] ${className}`} aria-hidden="true">
      <defs>
        <filter id={`grain-${variant}`} filterUnits="userSpaceOnUse" x="-600" y="-600" width="2640" height="2100">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 -0.1" result="specks" />
          <feComposite in="specks" in2="SourceGraphic" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
        <filter id={`soft-${variant}`} filterUnits="userSpaceOnUse" x="-600" y="-600" width="2640" height="2100">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g filter={`url(#grain-${variant})`}>
        <path className="draw" pathLength={1} d={d} fill="none" stroke="#1d6fd6" strokeWidth={w} strokeLinecap="round" transform="translate(0 14)" />
        <path className="draw" pathLength={1} d={d} fill="none" stroke="#4da2ff" strokeWidth={w * 0.9} strokeLinecap="round" />
        <path className="draw" pathLength={1} d={d} fill="none" stroke="#a9d3ff" strokeWidth={w * 0.32} strokeLinecap="round" transform="translate(-6 -26)" filter={`url(#soft-${variant})`} opacity={0.9} />
        <path className="draw" pathLength={1} d={d} fill="none" stroke="#ffffff" strokeWidth={w * 0.07} strokeLinecap="round" transform="translate(-10 -34)" opacity={0.75} />
      </g>
    </svg>
  );
});
