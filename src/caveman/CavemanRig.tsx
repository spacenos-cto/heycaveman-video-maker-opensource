// The caveman: one SVG rig drawn from a saved design. The same design object feeds this same
// code in every scene, which is why he looks identical everywhere (devpost/scope.md > The Unique Kernel).
import type { CavemanDesign, ExpressionId, MotionId } from '../types';
import { poseAt } from './motions';
import { solve, type Point } from './skeleton';

const INK = '#1F1A17';
const LIMB = 9;

type Props = {
  design: CavemanDesign;
  motion: MotionId;
  expression: ExpressionId;
  frame: number;
  /** 0 (closed) .. 1 (wide open). Undefined = gentle talk cycle. */
  mouthOpen?: number;
  /** Stable per scene so blinks don't sync across thumbnails. */
  blinkSeed?: number;
  talking?: boolean;
};

const line = (a: Point, b: Point) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
const limb = (a: Point, b: Point, c: Point) => `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y}`;

function Face({ c, r, expression, mouth, blink }: { c: Point; r: number; expression: ExpressionId; mouth: number; blink: boolean }) {
  const ex = r * 0.36;
  const ey = c.y - r * 0.12;
  const eyeR = expression === 'surprised' ? r * 0.13 : r * 0.09;
  const browY = ey - r * 0.3;
  const brow = (side: -1 | 1) => {
    const x = c.x + side * ex;
    const w = r * 0.2;
    // inner end of the brow is the one nearer the face centre (x - side*w)
    const tilt: Record<ExpressionId, number> = { neutral: 0, happy: -1, surprised: -3, worried: -4, determined: 5, sad: -3 };
    const lift = expression === 'surprised' ? -r * 0.12 : 0;
    const inner = browY + lift + tilt[expression];
    const outer = browY + lift - tilt[expression] * 0.4;
    return `M${x - side * w} ${inner} L${x + side * w} ${outer}`;
  };
  const eyes = blink
    ? [-1, 1].map((s) => <path key={s} d={`M${c.x + s * ex - eyeR} ${ey} L${c.x + s * ex + eyeR} ${ey}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />)
    : expression === 'happy'
      ? [-1, 1].map((s) => (
          <path key={s} d={`M${c.x + s * ex - eyeR * 1.4} ${ey + 2} Q${c.x + s * ex} ${ey - eyeR * 2} ${c.x + s * ex + eyeR * 1.4} ${ey + 2}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        ))
      : [-1, 1].map((s) => <circle key={s} cx={c.x + s * ex} cy={ey} r={eyeR} fill={INK} />);

  const my = c.y + r * 0.42;
  const mw = r * 0.34;
  let mouthEl;
  if (mouth > 0.08) {
    mouthEl = <ellipse cx={c.x} cy={my} rx={mw * (0.55 + mouth * 0.3)} ry={r * 0.08 + mouth * r * 0.22} fill="#5B2A22" stroke={INK} strokeWidth={4} />;
  } else {
    const curve: Record<ExpressionId, number> = { neutral: 3, happy: 10, surprised: 0, worried: -3, determined: 0, sad: -9 };
    mouthEl =
      expression === 'surprised' ? (
        <circle cx={c.x} cy={my} r={r * 0.1} fill="#5B2A22" stroke={INK} strokeWidth={4} />
      ) : expression === 'worried' ? (
        <path d={`M${c.x - mw} ${my} q${mw / 2} -5 ${mw} 0 t${mw} 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      ) : (
        <path d={`M${c.x - mw} ${my} Q${c.x} ${my + curve[expression]} ${c.x + mw} ${my}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      );
  }
  return (
    <g data-testid="caveman-face" data-expression={expression}>
      {expression !== 'neutral' && expression !== 'happy' && [-1, 1].map((s) => <path key={s} d={brow(s as -1 | 1)} stroke={INK} strokeWidth={4} strokeLinecap="round" />)}
      {eyes}
      {mouthEl}
    </g>
  );
}

function Hair({ design, c, r }: { design: CavemanDesign; c: Point; r: number }) {
  if (design.style !== 'cartoon' || !design.hair || design.hair === 'none') return null;
  const col = design.hairColor ?? INK;
  const top = c.y - r;
  switch (design.hair) {
    case 'spiky':
      return <path d={`M${c.x - r} ${c.y - r * 0.3} L${c.x - r * 0.7} ${top - 12} L${c.x - r * 0.3} ${top + 2} L${c.x} ${top - 14} L${c.x + r * 0.3} ${top + 2} L${c.x + r * 0.7} ${top - 12} L${c.x + r} ${c.y - r * 0.3} Z`} fill={col} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
    case 'long':
      return <path d={`M${c.x - r * 1.05} ${c.y + r * 0.9} L${c.x - r * 1.05} ${c.y - r * 0.2} A${r * 1.05} ${r * 1.05} 0 0 1 ${c.x + r * 1.05} ${c.y - r * 0.2} L${c.x + r * 1.05} ${c.y + r * 0.9} L${c.x + r * 0.75} ${c.y + r * 0.9} L${c.x + r * 0.75} ${c.y - r * 0.35} L${c.x - r * 0.75} ${c.y - r * 0.35} L${c.x - r * 0.75} ${c.y + r * 0.9} Z`} fill={col} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
    case 'bun':
      return (
        <g>
          <circle cx={c.x} cy={top - r * 0.25} r={r * 0.38} fill={col} stroke={INK} strokeWidth={4} />
          <path d={`M${c.x - r} ${c.y - r * 0.15} A${r} ${r} 0 0 1 ${c.x + r} ${c.y - r * 0.15} Q${c.x} ${c.y - r * 0.55} ${c.x - r} ${c.y - r * 0.15} Z`} fill={col} stroke={INK} strokeWidth={4} />
        </g>
      );
    case 'curly':
      return <g>{[-0.8, -0.4, 0, 0.4, 0.8].map((k) => <circle key={k} cx={c.x + k * r} cy={top + Math.abs(k) * r * 0.45} r={r * 0.32} fill={col} stroke={INK} strokeWidth={3.5} />)}</g>;
    default: // short
      return <path d={`M${c.x - r} ${c.y - r * 0.1} A${r} ${r} 0 0 1 ${c.x + r} ${c.y - r * 0.1} Q${c.x + r * 0.2} ${c.y - r * 0.6} ${c.x - r} ${c.y - r * 0.1} Z`} fill={col} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
  }
}

function Extras({ design, c, r }: { design: CavemanDesign; c: Point; r: number }) {
  if (design.style !== 'cartoon') return null;
  const ex = r * 0.36;
  const ey = c.y - r * 0.12;
  return (
    <g>
      {design.facialHair === 'beard' && <path d={`M${c.x - r * 0.85} ${c.y + r * 0.1} Q${c.x} ${c.y + r * 1.45} ${c.x + r * 0.85} ${c.y + r * 0.1} Q${c.x} ${c.y + r * 0.75} ${c.x - r * 0.85} ${c.y + r * 0.1} Z`} fill={design.hairColor ?? INK} stroke={INK} strokeWidth={4} />}
      {design.facialHair === 'moustache' && <path d={`M${c.x - r * 0.38} ${c.y + r * 0.3} Q${c.x} ${c.y + r * 0.12} ${c.x + r * 0.38} ${c.y + r * 0.3}`} stroke={design.hairColor ?? INK} strokeWidth={7} strokeLinecap="round" fill="none" />}
      {design.glasses && design.glasses !== 'none' && (
        <g fill="none" stroke={INK} strokeWidth={3.5}>
          {[-1, 1].map((s) =>
            design.glasses === 'square' ? (
              <rect key={s} x={c.x + s * ex - r * 0.2} y={ey - r * 0.16} width={r * 0.4} height={r * 0.32} rx={3} />
            ) : (
              <circle key={s} cx={c.x + s * ex} cy={ey} r={r * 0.21} />
            ),
          )}
          <path d={`M${c.x - ex + r * 0.2} ${ey} L${c.x + ex - r * 0.2} ${ey}`} />
        </g>
      )}
    </g>
  );
}

export function CavemanRig({ design, motion, expression, frame, mouthOpen, blinkSeed = 0, talking = true }: Props) {
  const pose = poseAt(motion, frame);
  const s = solve(pose, design.headSize ?? 1);
  const shirt = design.clothesColor ?? '#3D7FC4';
  const trousers = design.trousersColor ?? INK;
  const cartoon = design.style === 'cartoon';
  // Blink for 4 frames every ~3.5 s, offset per scene.
  const blink = (frame + blinkSeed * 37) % 105 < 4;
  const mouth = mouthOpen ?? (talking && motion !== 'idle' ? Math.max(0, Math.sin(frame / 2.6)) * 0.55 : 0);

  return (
    <g data-testid="caveman" data-motion={motion}>
      {/* legs */}
      {[
        [s.hip, s.lKnee, s.lFoot],
        [s.hip, s.rKnee, s.rFoot],
      ].map(([a, b, c], i) => (
        <g key={i}>
          {cartoon && <path d={limb(a, b, c)} stroke={INK} strokeWidth={LIMB + 9} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          <path d={limb(a, b, c)} stroke={cartoon ? trousers : INK} strokeWidth={cartoon ? LIMB + 3 : LIMB} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
      {/* torso: outlined shirt */}
      <path d={line(s.hip, s.neck)} stroke={INK} strokeWidth={cartoon ? 40 : 30} strokeLinecap="round" />
      <path d={line(s.hip, s.neck)} stroke={shirt} strokeWidth={cartoon ? 32 : 22} strokeLinecap="round" />
      {cartoon && design.clothes === 'labcoat' && <path d={line({ x: s.hip.x, y: s.hip.y + 6 }, s.neck)} stroke={INK} strokeWidth={2.5} />}
      {/* arms (drawn after the torso so gestures read clearly) */}
      {[
        [s.shoulder, s.lElbow, s.lHand],
        [s.shoulder, s.rElbow, s.rHand],
      ].map(([a, b, c], i) => (
        <g key={i}>
          {cartoon && <path d={limb(a, b, c)} stroke={INK} strokeWidth={LIMB + 7} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          <path d={limb(a, b, c)} stroke={cartoon ? shirt : INK} strokeWidth={cartoon ? LIMB + 1 : LIMB} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx={c.x} cy={c.y} r={7} fill={design.skin} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* head */}
      <circle cx={s.headCenter.x} cy={s.headCenter.y} r={s.headRadius} fill={design.skin} stroke={INK} strokeWidth={7} />
      <Hair design={design} c={s.headCenter} r={s.headRadius} />
      <Face c={s.headCenter} r={s.headRadius} expression={expression} mouth={mouth} blink={blink} />
      <Extras design={design} c={s.headCenter} r={s.headRadius} />
    </g>
  );
}
