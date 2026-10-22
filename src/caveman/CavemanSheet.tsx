// Meet your caveman (devpost/prd.md > F4): four presets, Customise with a live waving preview, then
// "Use this caveman" or "Skip — use Cavey". The same sheet edits My caveman (header) or one video's caveman.
import { useEffect, useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { en } from '../i18n/en';
import { usePremium } from '../data/premium';
import type { CavemanDesign } from '../types';
import { Button } from '../ui/Button';
import { CavemanRig } from './CavemanRig';
import { CAVEY, PRESETS, SKIN_TONES, SWATCHES } from './presets';

const t = en.caveman;
const CLOTHES = ['tshirt', 'hoodie', 'formal', 'kurta', 'dress', 'labcoat'];
const HAIR = ['none', 'short', 'spiky', 'long', 'bun', 'curly'];
const HAIR_COLOURS = ['#1F1A17', '#3A2A20', '#6B4A2E', '#B8742E', '#E3C16F', '#B8AFA3', '#B8482A', '#7B5EA7'];
/** Same look, field by field (the name doesn't count; unset = none). */
const same = (a: CavemanDesign, b: CavemanDesign) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => k === 'name' || ((a as Record<string, unknown>)[k] ?? 'none') === ((b as Record<string, unknown>)[k] ?? 'none'));

function useFrame(running = true) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!running || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setFrame(Math.floor(((performance.now() - start) / 1000) * 30));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return frame;
}

function Swatches({ label, colours, value, onPick, disabled }: { label: string; colours: string[]; value?: string; onPick: (c: string) => void; disabled?: boolean }) {
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {colours.map((c) => (
          <button key={c} type="button" disabled={disabled} aria-label={`${label} ${c}`} aria-pressed={value?.toLowerCase() === c.toLowerCase()} onClick={() => onPick(c)} className={`h-7 w-7 rounded-full border-2 ${value?.toLowerCase() === c.toLowerCase() ? 'border-charcoal ring-2 ring-ochre ring-offset-1' : 'border-charcoal/40'}`} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

function Chips({ label, options, names, value, onPick, disabled }: { label: string; options: string[]; names: Record<string, string>; value?: string; onPick: (v: string) => void; disabled?: boolean }) {
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => {
          const on = (value ?? 'none') === o || (!value && o === options[0]);
          return (
            <button key={o} type="button" disabled={disabled} aria-pressed={on} onClick={() => onPick(o)} className={`rounded-full border-2 px-2.5 py-0.5 text-sm ${on ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`}>
              {names[o]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type SheetMode = 'first' | 'mine' | 'project';

/**
 * `first`: before the first Make (Use / Skip). `mine`: edit My caveman. `project`: change one video's
 * caveman, then ask "just this video, or new videos too?" (prd.md > F4 Rule 2).
 */
export function CavemanSheet({ mode, initial, onDone, onCancel }: { mode: SheetMode; initial?: CavemanDesign; onDone: (design: CavemanDesign, alsoMine: boolean) => void; onCancel?: () => void }) {
  const showLocked = usePremium('lockedStyles');
  const [design, setDesign] = useState<CavemanDesign>(initial ?? CAVEY);
  const [open, setOpen] = useState(false);
  const [askScope, setAskScope] = useState(false);
  const [waveFrom, setWaveFrom] = useState(0);
  const frame = useFrame();
  const premium = design.style !== 'classic' && design.style !== 'cartoon';
  const cartoon = design.style !== 'classic';

  const change = (patch: Partial<CavemanDesign>) => {
    setDesign((d) => ({ ...d, ...patch }));
    setWaveFrom(frame); // the preview waves whenever anything changes
  };
  const finish = () => (mode === 'project' ? setAskScope(true) : onDone(design, true));
  const skip = () => (mode === 'first' ? onDone(CAVEY, true) : onCancel?.());
  const waving = frame - waveFrom < 60;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4" onClick={skip}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="caveman-title"
        className="panel max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-b-none p-5 sm:rounded-b-[18px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && skip()}
        data-testid="caveman-sheet"
      >
        <h2 id="caveman-title" className="font-display text-2xl font-bold">{t.title}</h2>
        {premium && <p className="mt-2 text-sm text-ash">{t.premiumNote}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Presets">
          {PRESETS.map((p) => {
            const on = same(design, p.design);
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => { setDesign({ ...p.design, name: design.name }); setWaveFrom(frame); }} className={`lift flex flex-col items-center gap-1.5 rounded-[18px] border-2 p-2 ${on ? 'border-black bg-sand -rotate-2' : 'border-hairline bg-bone'}`}>
                <svg viewBox="0 0 200 320" className="rig-stage h-28 w-full rounded-[12px]" aria-hidden="true">
                  <CavemanRig design={p.design} motion={on ? 'wave' : 'idle'} expression="happy" frame={frame} talking={false} blinkSeed={p.id.length} />
                </svg>
                <span className="font-display font-semibold">{p.label}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="mt-4 flex items-center gap-1 font-display font-semibold text-terracotta" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <ChevronDown size={18} aria-hidden="true" className={open ? 'rotate-180' : ''} /> {t.customise}
        </button>
        {open && (
          <div className="mt-3 grid gap-5 sm:grid-cols-[180px_1fr]">
            <div className="rig-stage flex items-start justify-center rounded-[18px] p-2 sm:sticky sm:top-0">
              <svg viewBox="0 0 200 320" className="h-56 w-36" aria-label="Preview" role="img" data-testid="caveman-preview">
                <CavemanRig design={design} motion={waving ? 'wave' : 'idle'} expression="happy" frame={frame} talking={false} />
              </svg>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{t.style}</p>
                <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label={t.style}>
                  {(['classic', 'cartoon'] as const).map((s) => (
                    <button key={s} type="button" aria-pressed={design.style === s || (s === 'cartoon' && premium)} onClick={() => change({ style: s })} className={`rounded-full border-2 px-3 py-0.5 text-sm ${design.style === s || (s === 'cartoon' && premium) ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`}>
                      {t.styles[s]}
                    </button>
                  ))}
                  {showLocked &&
                    ['Countryball', 'Blob'].map((n) => (
                      <span key={n} className="flex items-center gap-1 rounded-full border-2 border-dashed border-hairline px-3 py-0.5 text-sm text-ash" data-premium="style">
                        <Lock size={12} aria-hidden="true" /> {t.lockedStyle(n)}
                      </span>
                    ))}
                </div>
              </div>
              <Swatches label={t.skin} colours={SKIN_TONES} value={design.skin} onPick={(skin) => change({ skin })} />
              {!cartoon && <p className="text-xs text-ash">{t.clothesHint}</p>}
              <Chips label={t.clothes} options={CLOTHES} names={t.clothesList} value={design.clothes ?? 'tshirt'} onPick={(clothes) => change({ clothes })} disabled={!cartoon} />
              <Swatches label={t.clothesColor} colours={SWATCHES} value={design.clothesColor} onPick={(clothesColor) => change({ clothesColor })} />
              <Swatches label={t.trousersColor} colours={SWATCHES} value={design.trousersColor} onPick={(trousersColor) => change({ trousersColor })} disabled={!cartoon} />
              <Chips label={t.hair} options={HAIR} names={t.hairList} value={design.hair} onPick={(hair) => change({ hair })} disabled={!cartoon} />
              <Swatches label={t.hairColor} colours={HAIR_COLOURS} value={design.hairColor} onPick={(hairColor) => change({ hairColor })} disabled={!cartoon} />
              <Chips label={t.glasses} options={['none', 'round', 'square']} names={t.glassesList} value={design.glasses} onPick={(glasses) => change({ glasses })} disabled={!cartoon} />
              <Chips label={t.facialHair} options={['none', 'moustache', 'beard']} names={t.facialHairList} value={design.facialHair} onPick={(facialHair) => change({ facialHair })} disabled={!cartoon} />
              <label className="block text-sm">
                <span className="font-semibold">{t.headSize}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-ash">
                  {t.small}
                  <input type="range" min={0.8} max={1.3} step={0.05} value={design.headSize} onChange={(e) => change({ headSize: Number(e.target.value) })} className="flex-1 accent-violet" />
                  {t.big}
                </span>
              </label>
              <label className="block text-sm">
                <span className="font-semibold">{t.name}</span>
                <input value={design.name ?? ''} maxLength={30} onChange={(e) => setDesign((d) => ({ ...d, name: e.target.value || undefined }))} placeholder={t.namePlaceholder} className="mt-1 w-full rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5" />
              </label>
            </div>
          </div>
        )}

        {askScope ? (
          <div className="mt-6 rounded-[12px] border-2 border-ochre p-4" role="alert">
            <p className="font-display font-semibold">{t.scopeTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onDone(design, false)}>{t.justThis}</Button>
              <Button onClick={() => onDone(design, true)}>{t.alsoMine}</Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" className="py-3" onClick={finish}>{t.use}</Button>
            <Button variant="ghost" onClick={skip}>{mode === 'first' ? t.skip : t.cancel}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
