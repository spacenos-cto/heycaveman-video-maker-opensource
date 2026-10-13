// The caveman's round head beside a terracotta handprint (devpost/prd.md > Look and Feel).
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="#B8482A">
        <ellipse cx="44" cy="40" rx="11" ry="12" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={34 + i * 6} y={18 + Math.abs(1.5 - i) * 3} width="5" height="16" rx="2.5" />
        ))}
        <rect x="27" y="36" width="12" height="5" rx="2.5" transform="rotate(-30 33 38)" />
      </g>
      <circle cx="24" cy="30" r="17" fill="#F2C8A0" stroke="#1F1A17" strokeWidth="4" />
      <circle cx="18" cy="28" r="2.4" fill="#1F1A17" />
      <circle cx="29" cy="28" r="2.4" fill="#1F1A17" />
      <path d="M17 36 Q23.5 41 30 36" stroke="#1F1A17" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
