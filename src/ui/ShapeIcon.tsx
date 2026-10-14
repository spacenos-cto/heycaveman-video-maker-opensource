// A tiny frame showing a video shape (devpost/prd.md > F5).
import type { Shape } from '../types';

const SIZE: Record<Shape, [number, number]> = { wide: [40, 22.5], tall: [16, 28], square: [26, 26] };

export function ShapeIcon({ shape, className = '' }: { shape: Shape; className?: string }) {
  const [w, h] = SIZE[shape];
  return (
    <svg viewBox="0 0 44 32" className={`h-8 w-11 ${className}`} aria-hidden="true">
      <rect x={(44 - w) / 2} y={(32 - h) / 2} width={w} height={h} rx={3} fill="none" stroke="currentColor" strokeWidth={2.5} />
    </svg>
  );
}
