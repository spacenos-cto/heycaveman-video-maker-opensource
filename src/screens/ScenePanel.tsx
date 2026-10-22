// Tap a scene to change it (devpost/prd.md > F8): one scene's words, caption, caveman, background,
// drawings and sound, plus duplicate / delete / move / add. Every change shows in the player at once
// and can be undone (Ctrl+Z / Ctrl+Y or the buttons).
import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Redo2, Search, Trash2, Undo2, Volume2, X } from 'lucide-react';
import { audioContext, playSfx } from '../audio/sounds';
import { CavemanRig } from '../caveman/CavemanRig';
import { PROP_ASSETS, SETTING_ASSETS, assetById } from '../director/props';
import { SFX_FILES } from '../director/sfx';
import { nameMatch, tokens } from '../director/words';
import { addProp, addSceneAfter, deleteScene, duplicateScene, editCaption, editScene, MAX_PROPS, moveScene, removeProp } from '../editor/sceneOps';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { EXPRESSIONS, MOTIONS, type Caption, type ManifestAsset, type MotionId } from '../types';
import { Button } from '../ui/Button';
import { MOODS } from '../video/moods';
import { ui } from '../ui/uiSounds';

const t = en.scenePanel;
const label = (a: ManifestAsset) => a.names[0].replace('*', '');
const STYLES = ['mood', 'yellow', 'red', 'white', 'outlined'] as const;
const STYLE_SWATCH: Record<(typeof STYLES)[number], string> = { mood: 'linear-gradient(135deg,#4CC9F0,#FFD60A)', yellow: '#FFD60A', red: '#FF5A4E', white: '#FFFFFF', outlined: '#1F1A17' };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-hairline pt-4">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** A small caveman doing the action; it only moves while it's the chosen one or under the pointer. */
function MotionChip({ motion, selected, onPick }: { motion: MotionId; selected: boolean; onPick: () => void }) {
  const design = useApp((s) => s.project?.caveman);
  const [hover, setHover] = useState(false);
  const [frame, setFrame] = useState(12);
  const live = selected || hover;
  useEffect(() => {
    if (!live) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setFrame(12 + Math.floor(((performance.now() - start) / 1000) * 30));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);
  if (!design) return null;
  return (
    <button
      type="button"
      onClick={onPick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      aria-pressed={selected}
      className={`flex flex-col items-center rounded-[12px] border-2 px-1 pb-1 pt-0.5 text-xs ${selected ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`}
    >
      <svg viewBox="0 0 200 320" className="rig-stage h-12 w-full rounded-[8px]" aria-hidden="true">
        <CavemanRig design={design} motion={motion} expression="happy" frame={frame} talking={false} />
      </svg>
      {t.motions[motion]}
    </button>
  );
}

function PropSearch({ onAdd, full }: { onAdd: (id: string) => void; full: boolean }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const words = tokens(q);
    if (!words.length) return PROP_ASSETS.slice(0, 12);
    return PROP_ASSETS.filter((a) => a.names.some((n) => nameMatch(n, words, q.toLowerCase()) > 0 || n.replace('*', '').startsWith(q.toLowerCase().trim())));
  }, [q]);
  return (
    <div className="mt-3 rounded-[12px] border-2 border-hairline p-3">
      <label className="flex items-center gap-2 rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">{t.search}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchHint} className="w-full bg-transparent outline-none" autoFocus />
      </label>
      {full && <p className="mt-2 text-sm text-berry">{t.maxProps}</p>}
      {results.length ? (
        <ul className="mt-3 grid grid-cols-4 gap-2" aria-label={t.search}>
          {results.map((a) => (
            <li key={a.id}>
              <button type="button" disabled={full} onClick={() => onAdd(a.id)} className="flex w-full flex-col items-center rounded-[10px] border-2 border-hairline bg-bone p-1 text-[11px] disabled:opacity-40" aria-label={`Add ${label(a)}`}>
                <img src={`/${a.file}`} alt="" className="h-12 w-12 object-contain" loading="lazy" />
                <span className="w-full truncate text-center">{label(a)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ash">{t.noMatch}</p>
      )}
    </div>
  );
}

/** `onClose` absent = shown inside the Editor, which has its own heading and undo buttons. */
export const ScenePanel = memo(function ScenePanel({ index, onSelect, onClose }: { index: number; onSelect: (i: number) => void; onClose?: () => void }) {
  const { project, setProject, undo, redo, history, readOnly } = useApp();
  const [adding, setAdding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    setAdding(false);
    setProblem(null);
    setConfirmDelete(false);
  }, [index]);
  const scene = project?.scenes[index];
  if (!project || !scene) return null;

  const caption: Caption = scene.captions[0] ?? { text: '' };
  const mood = MOODS[project.mood];
  const change = (next: typeof project, key?: string) => {
    setProblem(null);
    setProject(next, key);
  };

  const remove = () => {
    const next = deleteScene(project, index);
    if (next === 'onlyScene') {
      ui.nope();
      return setProblem(t.onlyScene);
    }
    if (scene.voice.type === 'recorded' && !confirmDelete) return setConfirmDelete(true);
    setConfirmDelete(false);
    change(next);
    onSelect(Math.min(index, next.scenes.length - 1));
  };

  const chip = (selected: boolean) => `rounded-full border-2 px-3 py-1 text-sm ${selected ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`;

  return (
    <aside className="panel flex max-h-[calc(100vh-2rem)] flex-col p-0 lg:sticky lg:top-4" aria-labelledby={onClose ? 'scene-panel-title' : undefined} aria-label={onClose ? undefined : t.title(index + 1)} data-testid="scene-panel" data-scene-panel>
      {onClose && (
      <div className="flex items-center gap-2 border-b-2 border-charcoal px-4 py-3">
        <h2 id="scene-panel-title" className="flex-1 font-display text-xl font-bold">{t.title(index + 1)}</h2>
        <button type="button" onClick={undo} disabled={!history.past.length || readOnly} className="rounded-[10px] p-1.5 disabled:opacity-30" aria-label={t.undo} title={`${t.undo} (Ctrl+Z)`}>
          <Undo2 size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={redo} disabled={!history.future.length || readOnly} className="rounded-[10px] p-1.5 disabled:opacity-30" aria-label={t.redo} title={`${t.redo} (Ctrl+Y)`}>
          <Redo2 size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={onClose} className="rounded-[10px] p-1.5" aria-label={t.close}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
      <fieldset disabled={readOnly} className="min-w-0 space-y-4 px-4 pb-5 pt-3">
        <label className="block">
          <span className="font-display text-lg font-semibold">{t.words}</span>
          <span className="block text-sm text-ash">{t.wordsHint}</span>
          <textarea
            value={scene.words}
            onChange={(e) => change(editScene(project, index, { words: e.target.value }), `words:${scene.id}`)}
            rows={3}
            className="mt-1 w-full rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5"
          />
        </label>
        {scene.voice.stale && <p className="text-sm text-terracotta" role="status">{t.voiceStale}</p>}

        <Section title={t.caption}>
          <label className="block">
            <span className="text-sm text-ash">{t.captionHint}</span>
            <input
              value={caption.text}
              onChange={(e) => change(editCaption(project, index, { text: e.target.value }), `caption:${scene.id}`)}
              className="mt-1 w-full rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5 font-display font-semibold"
              aria-label={t.caption}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.style}>
            {STYLES.map((s) => {
              const selected = (caption.style ?? 'mood') === s;
              return (
                <button key={s} type="button" aria-pressed={selected} className={`${chip(selected)} flex items-center gap-1.5`} onClick={() => change(editCaption(project, index, { style: s === 'mood' ? undefined : s }))}>
                  <span className="h-3.5 w-3.5 rounded-full border border-charcoal" style={{ background: STYLE_SWATCH[s] }} aria-hidden="true" />
                  {t.styles[s]}
                </button>
              );
            })}
          </div>

          {caption.text.trim() && !caption.wordArt && (
            <div className="mt-3">
              <p className="text-sm font-semibold">{t.keyword}</p>
              <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label={t.keyword}>
                {caption.text.split(/\s+/).filter(Boolean).map((w, i) => (
                  <button key={`${w}-${i}`} type="button" aria-pressed={caption.keyword === w} className={chip(caption.keyword === w)} onClick={() => change(editCaption(project, index, { keyword: caption.keyword === w ? undefined : w }))}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

        {scene.kind === 'quiz' && scene.quiz && (
          <Section title={t.quiz}>
            <label className="block text-sm">
              <span className="font-semibold">{en.lesson.question}</span>
              <input value={scene.quiz.question} onChange={(e) => change(editScene(project, index, { quiz: { ...scene.quiz!, question: e.target.value }, words: e.target.value }), `quiz:${scene.id}`)} className="mt-1 w-full rounded-[12px] border-[1.5px] border-black bg-white px-2 py-1.5" />
            </label>
            {!scene.quiz.options?.length && (
              <label className="mt-2 block text-sm">
                <span className="font-semibold">{en.lesson.answer}</span>
                <input value={scene.quiz.answer ?? ''} placeholder="Discuss!" onChange={(e) => change(editScene(project, index, { quiz: { ...scene.quiz!, answer: e.target.value || undefined } }), `quiz-a:${scene.id}`)} className="mt-1 w-full rounded-[12px] border-[1.5px] border-black bg-white px-2 py-1.5" />
              </label>
            )}
            <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
              {en.lesson.thinkTime}
              <select value={scene.quiz.thinkSeconds} onChange={(e) => change(editScene(project, index, { quiz: { ...scene.quiz!, thinkSeconds: Number(e.target.value) } }))} className="rounded-full border-[1.5px] border-black bg-white px-2 py-1">
                {[3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} s</option>)}
              </select>
            </label>
          </Section>
        )}

        <Section title={t.caveman}>
          <p className="text-sm font-semibold">{t.action}</p>
          <div className="mt-1 grid grid-cols-4 gap-1.5 sm:grid-cols-8 lg:grid-cols-4" role="group" aria-label={t.action}>
            {MOTIONS.map((m) => (
              <MotionChip key={m} motion={m} selected={scene.motion === m} onPick={() => change(editScene(project, index, { motion: m }))} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold">{t.face}</p>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t.face}>
            {EXPRESSIONS.map((x) => (
              <button key={x} type="button" aria-pressed={scene.expression === x} className={chip(scene.expression === x)} onClick={() => change(editScene(project, index, { expression: x }))}>
                {t.faces[x]}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!scene.hideCaveman} onChange={(e) => change(editScene(project, index, { hideCaveman: e.target.checked }))} className="h-4 w-4 accent-violet" />
            {t.hideCaveman}
          </label>
        </Section>

        <Section title={t.background}>
          <p className="text-sm font-semibold">{t.colours}</p>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t.colours}>
            {mood.backgrounds.map((c) => {
              const selected = scene.background.type === 'color' && scene.background.color === c;
              return (
                <button key={c} type="button" aria-pressed={selected} aria-label={c} onClick={() => change(editScene(project, index, { background: { type: 'color', color: c, manual: true } }))} className={`h-8 w-8 rounded-full border-2 ${selected ? 'border-charcoal ring-2 ring-ochre ring-offset-2' : 'border-charcoal/40'}`} style={{ background: c }} />
              );
            })}
          </div>
          <p className="mt-3 text-sm font-semibold">{t.places}</p>
          <div className="mt-1 grid grid-cols-4 gap-1.5" role="group" aria-label={t.places}>
            {SETTING_ASSETS.map((a) => {
              const selected = scene.background.type === 'setting' && scene.background.assetId === a.id;
              return (
                <button key={a.id} type="button" aria-pressed={selected} aria-label={label(a)} title={label(a)} onClick={() => change(editScene(project, index, { background: { type: 'setting', assetId: a.id } }))} className={`overflow-hidden rounded-[8px] border-2 ${selected ? 'border-ochre' : 'border-hairline'}`}>
                  <img src={`/${a.file}`} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t.props}>
          {scene.props.length ? (
            <ul className="flex flex-wrap gap-2">
              {scene.props.map((p, i) => {
                const a = assetById(p.assetId);
                const name = a ? label(a) : p.assetId;
                return (
                  <li key={`${p.assetId}-${i}`} className="flex items-center gap-1 rounded-[10px] border-2 border-hairline bg-bone py-0.5 pl-1 pr-0.5">
                    {a && <img src={`/${a.file}`} alt="" className="h-8 w-8 object-contain" />}
                    <span className="text-sm">{name}</span>
                    <button type="button" onClick={() => change(removeProp(project, index, i))} className="rounded p-1" aria-label={t.remove(name)}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ash">{t.noProps}</p>
          )}
          {adding ? (
            <PropSearch full={scene.props.length >= MAX_PROPS} onAdd={(id) => { ui.pop(); change(addProp(project, index, id)); }} />
          ) : (
            <Button className="mt-2 px-3 py-1.5 text-sm" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden="true" /> {t.addProp}
            </Button>
          )}
        </Section>

        <Section title={t.sound}>
          <div className="flex items-center gap-2">
            <select value={scene.sfx ?? ''} onChange={(e) => change(editScene(project, index, { sfx: e.target.value || undefined }))} aria-label={t.sound} className="rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5">
              <option value="">{t.noSound}</option>
              {SFX_FILES.map((s) => (
                <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            {scene.sfx && (
              <Button className="px-3 py-1.5 text-sm" onClick={() => void playSfx(audioContext(), scene.sfx!).catch(() => undefined)}>
                <Volume2 size={16} aria-hidden="true" /> {t.preview}
              </Button>
            )}
          </div>
        </Section>

        <Section title={t.actions}>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={!!scene.pauseHere} onChange={(e) => change(editScene(project, index, { pauseHere: e.target.checked || undefined }))} className="h-4 w-4 accent-black" />
            {t.pauseHere}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button className="px-3 py-1.5 text-sm" onClick={() => { change(duplicateScene(project, index)); onSelect(index + 1); }}>
              <Copy size={16} aria-hidden="true" /> {t.duplicate}
            </Button>
            <Button className="px-3 py-1.5 text-sm" onClick={() => { change(addSceneAfter(project, index)); onSelect(index + 1); }}>
              <Plus size={16} aria-hidden="true" /> {t.addAfter}
            </Button>
            <Button className="px-3 py-1.5 text-sm" disabled={index === 0} onClick={() => { change(moveScene(project, index, -1)); onSelect(index - 1); }}>
              <ArrowUp size={16} aria-hidden="true" /> {t.earlier}
            </Button>
            <Button className="px-3 py-1.5 text-sm" disabled={index === project.scenes.length - 1} onClick={() => { change(moveScene(project, index, 1)); onSelect(index + 1); }}>
              <ArrowDown size={16} aria-hidden="true" /> {t.later}
            </Button>
            <Button className="col-span-2 px-3 py-1.5 text-sm text-berry" onClick={remove}>
              <Trash2 size={16} aria-hidden="true" /> {t.delete}
            </Button>
          </div>
          {confirmDelete && (
            <div className="mt-3 rounded-[12px] border-2 border-berry p-3" role="alert">
              <p>{t.confirmRecorded}</p>
              <div className="mt-2 flex gap-2">
                <Button className="px-3 py-1.5 text-sm" onClick={remove}>{t.deleteAnyway}</Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>{t.keep}</Button>
              </div>
            </div>
          )}
          {problem && <p className="mt-3 text-sm text-berry" role="alert">{problem}</p>}
        </Section>
      </fieldset>
      </div>
    </aside>
  );
});
