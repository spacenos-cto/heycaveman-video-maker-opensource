// Making progress (devpost/prd.md > F6): the caveman pushes a stone wheel while the steps tick off.
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { CavemanRig } from '../caveman/CavemanRig';
import { newProject } from '../director';
import { clean } from '../director/clean';
import { group } from '../director/group';
import { split } from '../director/split';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { projectDefaults } from '../store/settings';
import { Button } from '../ui/Button';
import { ui } from '../ui/uiSounds';

const STEP_MS = 380; // long enough to read each step; the director itself takes milliseconds

export function MakingScreen() {
  const { draft, go, setProject } = useApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [frame, setFrame] = useState(0);
  const cancelled = useRef(false);
  const sceneCount = group(split(clean(draft).text)).length;

  useEffect(() => {
    const raf = { id: 0 };
    const tick = () => {
      setFrame((f) => f + 1);
      raf.id = requestAnimationFrame(tick);
    };
    raf.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.id);
  }, []);

  useEffect(() => {
    cancelled.current = false;
    let timer: number;
    const run = async () => {
      try {
        for (let i = 1; i <= 3; i++) {
          await new Promise((r) => (timer = window.setTimeout(r, STEP_MS)));
          if (cancelled.current) return;
          setStep(i);
        }
        const made = newProject(draft, projectDefaults());
        if (cancelled.current) return;
        // Re-make replaces the edited video in place (one Undo brings the edits back).
        const { remakeId, project: open, setRemakeId } = useApp.getState();
        const project = remakeId && open?.id === remakeId ? { ...made, id: open.id, createdAt: open.createdAt, caveman: open.caveman } : made;
        setRemakeId(null);
        setProject(project);
        ui.success();
        go('player');
      } catch (e) {
        setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      }
    };
    void run();
    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [draft, go, setProject]);

  const labels = [en.making.steps[0] as string, (en.making.steps[1] as (n: number) => string)(sceneCount), en.making.steps[2] as string];

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col items-center px-4 pt-14 text-center">
      <h1 className="font-display text-3xl font-bold">{en.making.title}</h1>
      {/* A lit stage in the dark cave: the caveman rolls his stone wheel across while the steps tick off. */}
      <div className="relative mt-8 w-full max-w-md overflow-hidden rounded-[28px] border-[1.5px] border-black bg-sun p-3" aria-hidden="true">
        <svg viewBox="0 0 400 160" className="h-40 w-full">
          <line x1="0" y1="150" x2="400" y2="150" stroke="#1F1A17" strokeWidth="4" strokeLinecap="round" />
          <g transform={`translate(${40 + (Math.min(step, 3) / 3) * 220}, 0)`}>
            <svg x="0" y="10" width="88" height="141" viewBox="0 0 200 320">
              <CavemanRig design={projectDefaults().caveman} motion="walk" expression="determined" frame={frame} talking={false} />
            </svg>
            <g transform={`translate(110, 108) rotate(${frame * 4})`}>
              <circle r="38" fill="#B8AFA3" stroke="#1F1A17" strokeWidth="5" />
              <circle r="8" fill="#6B5F55" stroke="#1F1A17" strokeWidth="4" />
            </g>
          </g>
        </svg>
        <div className="mx-1 mb-1 mt-1 h-2 overflow-hidden rounded-full border-[1.5px] border-black bg-white">
          <div className="h-full rounded-full bg-black transition-[width] duration-300" style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} />
        </div>
      </div>
      {error ? (
        <div className="mt-6" role="alert">
          <p className="text-lg text-berry">{en.making.failed}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="primary" onClick={() => go('start')}>{en.making.tryAgain}</Button>
            <Button variant="ghost" onClick={() => setShowDetails((s) => !s)}>{en.making.details}</Button>
          </div>
          {showDetails && <pre className="mt-3 text-left text-xs text-ash">{error}</pre>}
        </div>
      ) : (
        <ol className="stagger mt-6 space-y-2 text-left" aria-live="polite">
          {labels.map((label, i) => (
            <li key={i} className={`flex items-center gap-2 ${i < step ? 'text-moss' : i === step ? 'text-charcoal' : 'text-ash'}`}>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-current">
                {i < step && <Check size={14} strokeWidth={3} />}
              </span>
              {label}
            </li>
          ))}
        </ol>
      )}
      {!error && (
        <Button className="mt-8" onClick={() => { cancelled.current = true; go('start'); }}>
          {en.making.cancel}
        </Button>
      )}
    </main>
  );
}
