// The caveman's round head beside an ember handprint, in the sticker palette (finish-to-submit PRD BRAND-1).
// Same drawing as public/icons/logo.svg; `badge` adds its white ring for places that don't draw their own.
export function Logo({ size = 40, badge = false }: { size?: number; badge?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {badge && <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#000000" strokeWidth="3" />}
      <g fill="#fb4903" stroke="#000000" strokeWidth="2.5">
        <ellipse cx="44" cy="40" rx="9.5" ry="10.5" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={35.5 + i * 5} y={i === 0 || i === 3 ? 24 : 21} width="4.5" height="14" rx="2.25" />
        ))}
      </g>
      <circle cx="25" cy="31" r="14" fill="#f2c8a0" stroke="#000000" strokeWidth="3.5" />
      <circle cx="20.5" cy="29.5" r="2" fill="#000000" />
      <circle cx="29.5" cy="29.5" r="2" fill="#000000" />
      <path d="M19.5 35.5 Q25 40 30.5 35.5" stroke="#000000" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
