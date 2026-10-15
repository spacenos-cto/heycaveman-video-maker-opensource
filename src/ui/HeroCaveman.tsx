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
const HERO_FPS = 20; // smooth enough for a waving stick figure, a third less work than 30
const ACT_FRAMES = 80; // he acts for ~2.7 s of rig time…
const REST_MS = 2200; // …then holds the pose without redrawing at all

function LiveCaveman({ box }: { box: React.RefObject<HTMLDivElement | null> }) {
  const design = useSettings((s) => s.myCaveman) ?? CAVEY;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let visible = true;
    let t = 0; // animation time, in frames of the rig's 30 fps clock
    let last = performance.now();
    let restUntil = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now < restUntil || now - last < 1000 / HERO_FPS) return;
      const before = Math.floor(t / ACT_FRAMES);
      t += Math.min(4, ((now - last) / 1000) * 30);
      last = now;
      if (Math.floor(t / ACT_FRAMES) !== before) restUntil = now + REST_MS; // finished an action: pause
      setFrame(Math.floor(t));
    };
    raf = requestAnimationFrame(tick);
    // Stop drawing while the poster is scrolled out of view.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      last = performance.now();
    });
    if (box.current) io.observe(box.current);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [box]);
  const motion = SHOWREEL[Math.floor(frame / ACT_FRAMES) % SHOWREEL.length];
  return <CavemanRig design={design} motion={motion} expression="happy" frame={frame} talking={motion === 'talk' || motion === 'explain'} />;
}

export function HeroCaveman() {
  const box = useRef<HTMLDivElement>(null);
  const man = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let pending = 0;
    const onMove = (e: PointerEvent) => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        // Only the caveman leans toward the pointer, moved directly on his own GPU layer: changing a CSS
        // variable on the whole poster made every sticker repaint on each mouse move.
        const x = (e.clientX / innerWidth - 0.5) * 18;
        const y = (e.clientY / innerHeight - 0.5) * 8;
        if (man.current) man.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };
    addEventListener('pointermove', onMove);
    return () => removeEventListener('pointermove', onMove);
  }, []);

  const word = en.appName.toUpperCase();
  return (
    <div ref={box} className="relative isolate select-none" data-testid="hero">
      <Ribbon className="absolute left-1/2 top-1/2 -z-10 h-[260%] w-[calc(100vw-28px)] -translate-x-1/2 -translate-y-[46%] [overflow-x:clip]" />
      <h2 className="sr-only">{en.appName}</h2>
      <p className="poster letters relative whitespace-nowrap text-center text-[16vw] text-black sm:text-[15vw] xl:text-[200px]" aria-hidden="true">
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
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.s}%`, maxWidth: s.s * 9, animationDelay: `${700 + i * 90}ms` }}
        >
          <img src={`/${s.file}`} alt="" className="wiggle pointer-events-auto block w-full" style={{ ['--r' as string]: `${s.r}deg`, animationDelay: `${-i * 0.9}s` }} />
        </span>
      ))}
      <svg
        viewBox="0 0 200 320"
        className="pop-in pointer-events-none absolute bottom-[-62%] right-[-3%] h-[190%] transition-transform duration-300 ease-out [contain:layout_paint] [will-change:transform] sm:right-[1%]"
        ref={man}
        style={{ animationDelay: '900ms' }}
        aria-hidden="true"
      >
        <LiveCaveman box={box} />
      </svg>
    </div>
  );
}
