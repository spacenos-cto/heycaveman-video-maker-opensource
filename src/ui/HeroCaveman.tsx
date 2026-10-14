// The Start screen's hero: your caveman, live, inside a glowing orb, with lesson drawings drifting around
// him. He follows the pointer a little and runs through a few of his 16 actions on his own.
import { useEffect, useRef, useState } from 'react';
import { CavemanRig } from '../caveman/CavemanRig';
import { CAVEY } from '../caveman/presets';
import { useSettings } from '../store/settings';
import type { MotionId } from '../types';

const SHOWREEL: MotionId[] = ['wave', 'explain', 'point', 'think', 'celebrate', 'talk'];
const ORBIT = [
  { file: 'assets/lightbulb.svg', x: 6, y: 16, s: 64, r: -12, d: 0 },
  { file: 'assets/rocket.svg', x: 78, y: 6, s: 70, r: 14, d: -1.5 },
  { file: 'assets/planet.svg', x: 84, y: 62, s: 62, r: 0, d: -3 },
  { file: 'assets/book.svg', x: 0, y: 68, s: 58, r: 10, d: -2.2 },
  { file: 'assets/star.svg', x: 44, y: -4, s: 40, r: 0, d: -4 },
  { file: 'assets/heart.svg', x: 60, y: 88, s: 42, r: -8, d: -0.8 },
];

export function HeroCaveman() {
  const design = useSettings((s) => s.myCaveman) ?? CAVEY;
  const [frame, setFrame] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (still) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setFrame(Math.floor(((performance.now() - start) / 1000) * 30));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      const el = box.current;
      if (!el) return;
      el.style.setProperty('--px', String(e.clientX / innerWidth - 0.5));
      el.style.setProperty('--py', String(e.clientY / innerHeight - 0.5));
    };
    addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, [still]);

  const motion = SHOWREEL[Math.floor(frame / 110) % SHOWREEL.length];
  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[380px] select-none" aria-hidden="true" data-testid="hero">
      {/* the orb: a slowly turning ring of ember light around a deep glass disc */}
      <div className="absolute inset-[8%] animate-[spin_18s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#ffc15e,#ff4f8b,#c94dff,#3df5ff,#ffc15e)] opacity-90 blur-[2px]" />
      <div className="absolute inset-[8%] animate-[spin_18s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#ffc15e,#ff4f8b,#c94dff,#3df5ff,#ffc15e)] opacity-60 blur-2xl" />
      <div className="rig-stage absolute inset-[9.5%] rounded-full shadow-[inset_0_-30px_60px_rgb(255_90_120/0.35),inset_0_10px_40px_rgb(255_255_255/0.6)]" />
      <div className="absolute inset-[9.5%] overflow-hidden rounded-full">
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,transparent,rgb(255_120_90/0.35))]" />
        <div className="absolute inset-x-[18%] bottom-[22%] h-3 rounded-[50%] bg-[rgb(31_26_23/0.18)] blur-[3px]" />
      </div>
      <svg viewBox="0 0 200 320" className="absolute left-1/2 top-[16%] h-[66%] transition-transform duration-300 ease-out" style={{ transform: 'translate(calc(-50% + var(--px, 0) * 14px), calc(var(--py, 0) * 10px))' }}>
        <CavemanRig design={design} motion={motion} expression="happy" frame={frame} talking={motion === 'talk' || motion === 'explain'} />
      </svg>
      {ORBIT.map((o, i) => (
        <img
          key={o.file}
          src={`/${o.file}`}
          alt=""
          className="float absolute drop-shadow-[0_10px_20px_rgb(255_120_80/0.35)]"
          style={{ left: `${o.x}%`, top: `${o.y}%`, width: o.s, ['--r' as string]: `${o.r}deg`, animationDelay: `${o.d}s`, translate: `calc(var(--px, 0) * ${(i % 3) * 10 + 8}px) calc(var(--py, 0) * ${(i % 2) * 10 + 8}px)` }}
        />
      ))}
    </div>
  );
}
