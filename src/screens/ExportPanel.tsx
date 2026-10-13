// Download video (devpost/prd.md > F13): pick quality and end card, then the caveman pushes a stone
// wheel while the MP4 is made in this browser. Explains before starting if the browser can't do it.
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CavemanRig } from '../caveman/CavemanRig';
import { checkCapability, outputSize, type Quality } from '../export/capability';
import { ExportError, fileName, renderMp4, type ExportProgress } from '../export/renderMp4';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import type { Project } from '../types';
import { Button } from '../ui/Button';

type Phase = 'choose' | 'unsupported' | 'working' | 'done' | 'failed';

const fmtMs = (ms: number) => {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
};

export function ExportPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const setProject = useApp((s) => s.setProject);
  const [quality, setQuality] = useState<Quality>('720p');
  const [phase, setPhase] = useState<Phase>('choose');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [message, setMessage] = useState('');
  const [frame, setFrame] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
    void checkCapability(...(Object.values(outputSize(project.shape, quality)) as [number, number])).then((c) => {
      if (!c.ok) setPhase('unsupported');
    });
  }, [project.shape, quality]);

  useEffect(() => {
    if (phase !== 'working') return;
    let raf = 0;
    const tick = () => {
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const start = async () => {
    setPhase('working');
    setProgress(null);
    abort.current = new AbortController();
    try {
      const blob = await renderMp4(project, { quality, signal: abort.current.signal, onProgress: setProgress });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName(project.title);
      a.dataset.testid = 'download-link';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setPhase('done');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setPhase('choose');
        return;
      }
      if (e instanceof ExportError && e.kind === 'unsupported') setPhase('unsupported');
      else {
        setMessage(e instanceof ExportError && e.kind === 'memory' ? en.exportPanel.tooLong : en.exportPanel.failed);
        setPhase('failed');
      }
    }
  };

  const pct = progress ? Math.round((progress.frame / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(31_26_23/0.45)] p-4 sm:items-center" onClick={phase === 'working' ? undefined : onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        tabIndex={-1}
        className="panel w-full max-w-lg p-6 outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && phase !== 'working' && onClose()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="export-title" className="font-display text-2xl font-bold">{en.exportPanel.title}</h2>
          {phase !== 'working' && (
            <button type="button" onClick={onClose} aria-label={en.exportPanel.close} className="rounded-[12px] p-1">
              <X size={22} aria-hidden="true" />
            </button>
          )}
        </div>

        {phase === 'unsupported' && <p className="mt-4" role="alert">{en.exportPanel.unsupported}</p>}

        {phase === 'choose' && (
          <>
            <fieldset className="mt-4">
              <legend className="font-display font-semibold">{en.exportPanel.quality}</legend>
              {(['720p', '1080p'] as const).map((q) => (
                <label key={q} className={`mt-2 flex cursor-pointer items-center gap-3 rounded-[12px] border-2 p-3 ${quality === q ? 'border-ochre bg-sand' : 'border-hairline'}`}>
                  <input type="radio" name="quality" value={q} checked={quality === q} onChange={() => setQuality(q)} className="accent-[#E8892B]" />
                  <span>{q === '720p' ? en.exportPanel.standard : en.exportPanel.hd}</span>
                </label>
              ))}
            </fieldset>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={project.endCard}
                onChange={(e) => setProject({ ...project, endCard: e.target.checked, updatedAt: Date.now() })}
                className="mt-1 h-5 w-5 accent-[#E8892B]"
              />
              <span>
                {en.exportPanel.endCard}
                <span className="block text-sm text-ash">{en.exportPanel.endCardHint}</span>
              </span>
            </label>
            <Button variant="primary" className="mt-6 w-full py-3 text-lg" onClick={() => void start()}>
              {en.exportPanel.start}
            </Button>
          </>
        )}

        {phase === 'working' && (
          <div className="mt-4" aria-live="polite">
            <svg viewBox="0 0 400 120" className="h-28 w-full" aria-hidden="true">
              <line x1="0" y1="112" x2="400" y2="112" stroke="#1F1A17" strokeWidth="4" strokeLinecap="round" />
              <g transform={`translate(${20 + (pct / 100) * 250}, 0)`}>
                <svg x="0" y="0" width="70" height="112" viewBox="0 0 200 320">
                  <CavemanRig design={project.caveman} motion="walk" expression="determined" frame={frame} talking={false} />
                </svg>
                <g transform={`translate(92, 82) rotate(${frame * 4})`}>
                  <circle r="28" fill="#B8AFA3" stroke="#1F1A17" strokeWidth="4" />
                  <circle r="6" fill="#6B5F55" stroke="#1F1A17" strokeWidth="3" />
                </g>
              </g>
            </svg>
            <div className="h-3 w-full overflow-hidden rounded-full border-2 border-charcoal bg-bone" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={en.exportPanel.progress}>
              <div className="h-full bg-ochre" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-ash" data-testid="export-status">
              {pct}% {progress?.etaMs != null ? `· ${en.exportPanel.timeLeft(fmtMs(progress.etaMs))}` : ''}
            </p>
            <p className="mt-1 text-sm text-ash">{en.exportPanel.keepOpen}</p>
            <Button className="mt-4" onClick={() => abort.current?.abort()}>{en.exportPanel.cancel}</Button>
          </div>
        )}

        {phase === 'done' && (
          <div className="mt-4" role="status">
            <p className="font-display text-lg font-semibold text-moss">{en.exportPanel.done(fileName(project.title))}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="primary" onClick={onClose}>{en.exportPanel.backToVideo}</Button>
            </div>
          </div>
        )}

        {phase === 'failed' && (
          <div className="mt-4" role="alert">
            <p className="text-berry">{message}</p>
            <Button variant="primary" className="mt-4" onClick={() => setPhase('choose')}>{en.making.tryAgain}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
