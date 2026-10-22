// The Editor (devpost/prd.md > F9): scene list with drag-to-reorder and lengths, the stage, the
// drawing library and pictures, captions with timing, and the selected item's details.
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, GripVertical, Pause, Play, Plus, Redo2, Smile, Trash2, Undo2 } from 'lucide-react';
import { CavemanSheet } from '../caveman/CavemanSheet';
import { useSettings } from '../store/settings';
import { en } from '../i18n/en';
import { ScenePanel } from '../screens/ScenePanel';
import { useApp } from '../store/app';
import type { Caption } from '../types';
import { Button } from '../ui/Button';
import { SceneSvg } from '../video/SceneSvg';
import { FPS, sceneFrames } from '../video/timeline';
import { assetById } from '../director/props';
import { Library } from './Library';
import { addCaption, addSceneAfter, editCaptionAt, removeCaption, removeProp, reorderScene, setCavemanAt, setDuration, setProp } from './sceneOps';
import { Stage, type Selection } from './Stage';
import { isUpload } from './uploads';

const t = en.editor;
const sec = (ms: number) => (ms / 1000).toFixed(1);
const STYLES: (Caption['style'] | undefined)[] = [undefined, 'yellow', 'red', 'white', 'outlined'];

/** A seconds box that only commits sensible numbers; empty means "not set". */
function SecondsInput({ label, value, onChange, placeholder, max }: { label: string; value?: number; onChange: (ms: number | undefined) => void; placeholder?: string; max: number }) {
  return (
    <label className="text-sm">
      <span className="block font-semibold">{label}</span>
      <input
        type="number"
        min={0}
        max={max / 1000}
        step={0.1}
        value={value === undefined ? '' : sec(value)}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (!v) return onChange(undefined);
          const n = Number(v);
          if (Number.isFinite(n) && n >= 0) onChange(Math.min(max, Math.round(n * 1000)));
        }}
        className="mt-1 w-28 rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1"
      />
    </label>
  );
}

export function EditorScreen() {
  const { project, setProject, go, undo, redo, history, readOnly, editorStart } = useApp();
  const [index, setIndex] = useState(Math.min(editorStart, (project?.scenes.length ?? 1) - 1));
  const [selection, setSelection] = useState<Selection>(null);
  const [frame, setFrame] = useState(24);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<'library' | 'scene'>('library');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [designing, setDesigning] = useState(false);
  const raf = useRef(0);

  const scene = project?.scenes[index];
  const frames = scene ? sceneFrames(scene) : 1;

  useEffect(() => {
    if (project && index >= project.scenes.length) setIndex(project.scenes.length - 1);
  }, [project, index]);
  useEffect(() => setSelection(null), [index]);
  useEffect(() => setFrame((f) => Math.min(f, frames - 1)), [frames]);

  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    const from = frame >= frames - 1 ? 0 : frame;
    const tick = () => {
      const f = from + Math.floor(((performance.now() - start) / 1000) * FPS);
      if (f >= frames - 1) {
        setFrame(frames - 1);
        setPlaying(false);
        return;
      }
      setFrame(f);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, frames]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // No video open (e.g. Back after it was deleted): go to Start after this render, never during it.
  const missing = !project || !scene;
  useEffect(() => {
    if (missing) go('start', { replace: true });
  }, [missing, go]);
  if (!project || !scene) return null;

  const select = (i: number) => {
    setPlaying(false);
    setIndex(i);
    setFrame(24);
  };
  const prop = selection?.kind === 'prop' ? scene.props[selection.index] : undefined;
  const propName = prop ? (isUpload(prop.assetId) ? t.myPictures : (assetById(prop.assetId)?.names[0].replace('*', '') ?? prop.assetId)) : '';

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-4" data-testid="editor">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" className="px-0" onClick={() => go('player')}>
          <ArrowLeft size={18} aria-hidden="true" /> {t.back}
        </Button>
        <h1 className="flex-1 font-display text-2xl font-bold">
          {t.title} <span className="text-ash">· {project.title}</span>
        </h1>
        <button type="button" onClick={undo} disabled={!history.past.length || readOnly} className="rounded-[10px] p-2 disabled:opacity-30" aria-label={en.scenePanel.undo} title="Ctrl+Z">
          <Undo2 size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={redo} disabled={!history.future.length || readOnly} className="rounded-[10px] p-2 disabled:opacity-30" aria-label={en.scenePanel.redo} title="Ctrl+Y">
          <Redo2 size={20} aria-hidden="true" />
        </button>
        <Button disabled={readOnly} onClick={() => setDesigning(true)}>
          <Smile size={18} aria-hidden="true" /> {t.character}
        </Button>
        <Button variant="primary" onClick={() => go('player')}>
          <Play size={18} fill="currentColor" aria-hidden="true" /> {t.watch}
        </Button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)_340px]">
        {/* Scene list */}
        <nav aria-label={t.scenes} className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h2 className="font-display text-lg font-semibold">{t.scenes}</h2>
          <p className="text-xs text-ash">{t.dragHint}</p>
          <ol className="mt-2 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" data-testid="scene-list">
            {project.scenes.map((s, i) => (
              <li
                key={s.id}
                draggable={!readOnly}
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => dragFrom !== null && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom === null) return;
                  setProject(reorderScene(project, dragFrom, i));
                  setIndex(i);
                  setDragFrom(null);
                }}
                onDragEnd={() => setDragFrom(null)}
                className={`w-36 shrink-0 lg:w-auto ${dragFrom === i ? 'opacity-40' : ''}`}
              >
                <button type="button" onClick={() => select(i)} aria-current={i === index ? 'true' : undefined} aria-label={t.scene(i + 1)} className={`block w-full overflow-hidden rounded-[10px] border-2 bg-bone text-left ${i === index ? 'border-ochre ring-2 ring-ochre ring-offset-1' : 'border-charcoal'}`}>
                  <SceneSvg project={project} scene={s} frame={Math.min(24, sceneFrames(s) - 1)} index={i} />
                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs">
                    <GripVertical size={12} aria-hidden="true" className="text-ash" />
                    <span className="font-semibold">{i + 1}</span>
                    <span className="flex-1 truncate text-ash">{s.captions[0]?.text}</span>
                    <span className="tabular-nums text-ash">{t.seconds(sec(s.durationMs))}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <Button className="mt-1 w-full px-3 py-1.5 text-sm" disabled={readOnly} onClick={() => { setProject(addSceneAfter(project, project.scenes.length - 1)); select(project.scenes.length); }}>
            <Plus size={16} aria-hidden="true" /> {t.addScene}
          </Button>
        </nav>

        {/* Stage and timing */}
        <section className="min-w-0 space-y-4" aria-label={t.scene(index + 1)}>
          <div className="mx-auto" style={{ maxWidth: project.shape === 'wide' ? '100%' : project.shape === 'square' ? '70vh' : '45vh' }}>
            <Stage sceneIndex={index} frame={frame} selection={selection} onSelect={(s) => { setSelection(s); setPlaying(false); }} />
          </div>
          <p className="text-xs text-ash">{t.stageHint}</p>
          <div className="flex flex-wrap items-end gap-4">
            <Button variant="primary" className="px-4 py-2" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />} {playing ? t.pauseScene : t.playScene}
            </Button>
            <label className="min-w-[180px] flex-1 text-sm">
              <span className="block font-semibold">{t.position}</span>
              <input type="range" min={0} max={frames - 1} value={frame} onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} className="w-full accent-violet" />
            </label>
            <span className="pb-1 font-display tabular-nums text-ash">{sec((frame / FPS) * 1000)} / {sec(scene.durationMs)} s</span>
            {scene.voice.type === 'none' ? (
              <SecondsInput label={t.length} value={scene.durationMs} max={30_000} onChange={(ms) => ms !== undefined && setProject(setDuration(project, index, ms), `len:${scene.id}`)} />
            ) : (
              <p className="pb-1 text-sm text-ash">{t.lengthVoice}</p>
            )}
          </div>

          {/* Selected item */}
          <div className="panel p-4" data-testid="selected">
            <h2 className="font-display text-lg font-semibold">
              {t.selected}: {selection ? (selection.kind === 'caveman' ? t.caveman : propName) : '—'}
            </h2>
            {!selection && <p className="text-sm text-ash">{t.nothingSelected}</p>}
            {prop && selection?.kind === 'prop' && (
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <label className="text-sm">
                  <span className="block font-semibold">{t.size}</span>
                  <input type="range" min={4} max={90} value={prop.scale} onChange={(e) => setProject(setProp(project, index, selection.index, { scale: Number(e.target.value) }), `size:${scene.id}`)} className="accent-violet" />
                </label>
                <label className="text-sm">
                  <span className="block font-semibold">{t.turn}</span>
                  <input type="range" min={-180} max={180} value={prop.rotation} onChange={(e) => setProject(setProp(project, index, selection.index, { rotation: Number(e.target.value) }), `turn:${scene.id}`)} className="accent-violet" />
                </label>
                <SecondsInput label={t.appears} value={prop.inMs} placeholder="0" max={scene.durationMs} onChange={(ms) => setProject(setProp(project, index, selection.index, { inMs: ms }), `in:${scene.id}`)} />
                <SecondsInput label={t.leaves} value={prop.outMs} placeholder={t.wholeScene} max={scene.durationMs} onChange={(ms) => setProject(setProp(project, index, selection.index, { outMs: ms }), `out:${scene.id}`)} />
                <Button className="px-3 py-1.5 text-sm text-berry" onClick={() => { setProject(removeProp(project, index, selection.index)); setSelection(null); }}>
                  <Trash2 size={16} aria-hidden="true" /> {t.removeProp}
                </Button>
              </div>
            )}
            {selection?.kind === 'caveman' && (
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <Button className="px-3 py-1.5 text-sm" disabled={!scene.cavemanAt} onClick={() => setProject(setCavemanAt(project, index, undefined))}>{t.resetCaveman}</Button>
                <Button variant="ghost" onClick={() => setTab('scene')}>{en.scenePanel.action} · {en.scenePanel.face} →</Button>
              </div>
            )}
          </div>

          {/* Captions */}
          <div className="panel p-4" data-testid="captions">
            <h2 className="font-display text-lg font-semibold">{t.captions}</h2>
            <ol className="mt-2 space-y-3">
              {scene.captions.map((c, ci) => (
                <li key={ci} className="flex flex-wrap items-end gap-3 rounded-[12px] border-2 border-hairline p-2">
                  <label className="min-w-[160px] flex-1 text-sm">
                    <span className="block font-semibold">{t.captionN(ci + 1)}</span>
                    <input value={c.text} onChange={(e) => setProject(editCaptionAt(project, index, ci, { text: e.target.value }), `cap:${scene.id}:${ci}`)} className="mt-1 w-full rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1 font-display font-semibold" />
                  </label>
                  <label className="text-sm">
                    <span className="block font-semibold">{t.style}</span>
                    <select value={c.style ?? ''} onChange={(e) => setProject(editCaptionAt(project, index, ci, { style: (e.target.value || undefined) as Caption['style'] }))} className="mt-1 rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1">
                      {STYLES.map((s) => (
                        <option key={s ?? 'mood'} value={s ?? ''}>{en.scenePanel.styles[s ?? 'mood']}</option>
                      ))}
                    </select>
                  </label>
                  <SecondsInput label={t.starts} value={c.startMs} placeholder="0" max={scene.durationMs} onChange={(ms) => setProject(editCaptionAt(project, index, ci, { startMs: ms }), `cs:${scene.id}:${ci}`)} />
                  <SecondsInput label={t.ends} value={c.endMs} placeholder={t.wholeScene} max={scene.durationMs} onChange={(ms) => setProject(editCaptionAt(project, index, ci, { endMs: ms }), `ce:${scene.id}:${ci}`)} />
                  <button type="button" onClick={() => setProject(removeCaption(project, index, ci))} className="rounded-[10px] p-2 text-berry" aria-label={`${t.removeCaption} ${ci + 1}`}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <Button className="mt-3 px-3 py-1.5 text-sm" disabled={readOnly} onClick={() => setProject(addCaption(project, index))}>
              <Plus size={16} aria-hidden="true" /> {t.addCaption}
            </Button>
          </div>
        </section>

        {/* Library and scene settings */}
        <aside className="min-w-0">
          <div className="mb-3 flex gap-2" role="tablist">
            {(['library', 'scene'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 rounded-full border-2 px-3 py-1.5 font-display font-semibold ${tab === k ? 'border-ochre bg-sand' : 'border-hairline bg-bone'}`}>
                {t.tabs[k]}
              </button>
            ))}
          </div>
          {tab === 'library' ? (
            <div className="panel p-3 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
              <Library sceneIndex={index} onAdded={(pi) => setSelection({ kind: 'prop', index: pi })} />
            </div>
          ) : (
            <ScenePanel index={index} onSelect={select} />
          )}
        </aside>
      </div>
      {designing && (
        <CavemanSheet
          mode="project"
          initial={project.caveman}
          onCancel={() => setDesigning(false)}
          onDone={(design, alsoMine) => {
            setProject({ ...project, caveman: design, updatedAt: Date.now() });
            if (alsoMine) useSettings.getState().update({ myCaveman: design });
            setDesigning(false);
          }}
        />
      )}
    </main>
  );
}
