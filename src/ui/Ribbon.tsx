// The inflatable blue ribbon (devpost/prd.md > Look and Feel v4). Its grainy 3D look is pre-rendered to one
// WebP by scripts/make-ribbon.mjs, because running the SVG grain filter live made the landing page lag.
// Here it is only a picture: it slides in once and then stays still, like the reference's ribbons.
import { memo } from 'react';

// Where the 1440×900 frame sits inside the rendered image (see make-ribbon.mjs: VIEW).
const VIEW = { x: -300, y: -20, w: 2040, h: 1000 };

export const Ribbon = memo(function Ribbon({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="ribbon-in h-full w-full overflow-visible">
        <image href="/ribbon-hero.webp" x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} preserveAspectRatio="none" />
      </svg>
    </div>
  );
});
