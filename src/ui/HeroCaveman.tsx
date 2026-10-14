// The Start screen's poster: a huge HEYCAVEMAN wordmark that the blue ribbon loops behind, lesson drawings
// stuck around it like stickers, and your caveman standing in front, running through his actions and
// leaning toward the pointer.
import { useEffect, useRef, useState } from 'react';
import { CavemanRig } from '../caveman/CavemanRig';
import { CAVEY } from '../caveman/presets';
import { en } from '../i18n/en';
import { useSettings } from '../store/settings';
import type { MotionId } from '../types';
import { Ribbon } from './Ribbon';

const SHOWREEL: MotionId[] = ['wave', 'explain', 'point', 'celebrate', 'think', 'talk'];
const STICKERS = [
  { file: 'assets/rocket.svg', x: 4, y: 6, s: 15, r: -14 },
  { file: 'assets/lightbulb.svg', x: 44, y: -2, s: 11, r: 10 },
  { file: 'assets/planet.svg', x: 72, y: -6, s: 13, r: 0 },
  { file: 'assets/book.svg', x: 2, y: 60, s: 12, r: 12 },
  { file: 'assets/star.svg', x: 66, y: 74, s: 8, r: 0 },
  { file: 'assets/heart.svg', x: 22, y: 70, s: 8, r: -10 },
];

/** The live caveman: the only part of the poster that redraws every frame (30 fps, paused when hidden). */
function LiveCaveman() {
  const design = useSettings((s) => s.myCaveman) ?? CAVEY;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setFrame(Math.floor(((performance.now() - start) / 1000) * 30));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const motion = SHOWREEL[Math.floor(frame / 110) % SHOWREEL.length];
  return <CavemanRig design={design} motion={motion} expression="happy" frame={frame} talking={motion === 'talk' || motion === 'explain'} />;
}

export function HeroCaveman() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let pending = 0;
    const onMove = (e: PointerEvent) => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        box.current?.style.setProperty('--px', (e.clientX / innerWidth - 0.5).toFixed(3));
        box.current?.style.setProperty('--py', (e.clientY / innerHeight - 0.5).toFixed(3));
      });
    };
    addEventListener('pointermove', onMove);
    return () => removeEventListener('pointermove', onMove);
  }, []);

  const word = en.appName.toUpperCase();
  return (
    <div ref={box} className="relative isolate select-none" data-testid="hero">
      <Ribbon className="absolute left-1/2 top-1/2 -z-10 h-[260%] w-[100vw] -translate-x-1/2 -translate-y-[46%]" />
      <h2 className="sr-only">{en.appName}</h2>
      <p className="poster letters relative text-center text-[19vw] text-black sm:text-[15vw] xl:text-[200px]" aria-hidden="true">
        {[...word].map((ch, i) => (
          <span key={i} style={{ animationDelay: `${120 + i * 55}ms` }}>
            {ch}
          </span>
        ))}
      </p>
      {STICKERS.map((s, i) => (
        <span
          key={s.file}
          aria-hidden="true"
          className="pop-in absolute"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.s}%`, maxWidth: s.s * 9, animationDelay: `${700 + i * 90}ms`, translate: `calc(var(--px, 0) * ${(i % 3) * 14 + 10}px) calc(var(--py, 0) * ${(i % 2) * 12 + 8}px)` }}
        >
          <img src={`/${s.file}`} alt="" className="float wiggle pointer-events-auto block w-full" style={{ ['--r' as string]: `${s.r}deg`, animationDelay: `${-i * 0.9}s` }} />
        </span>
      ))}
      <svg
        viewBox="0 0 200 320"
        className="pop-in pointer-events-none absolute bottom-[-62%] right-[-3%] h-[190%] transition-transform duration-300 ease-out [will-change:transform] sm:right-[1%]"
        style={{ transform: 'translate(calc(var(--px, 0) * 18px), calc(var(--py, 0) * 8px))', animationDelay: '900ms' }}
        aria-hidden="true"
      >
        <LiveCaveman />
      </svg>
    </div>
  );
}
