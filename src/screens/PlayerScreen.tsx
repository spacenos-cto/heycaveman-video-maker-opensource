// Watch the video (devpost/prd.md > F7). Our own player: a frame clock draws the current scene's SVG
// about 30 times a second, sounds play through Web Audio, and the same SVG becomes the MP4 on export.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Maximize, Mic, PencilRuler, Pause, Play, Save, Shuffle, Volume2 } from 'lucide-react';
import { shuffle } from '../director/shuffle';
import { audioContext, playFrom } from '../audio/sounds';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { Button } from '../ui/Button';
import { SceneSvg } from '../video/SceneSvg';
import { MOODS } from '../video/moods';
import { FPS, locate, sceneFrames, timeline } from '../video/timeline';
import { ExportPanel } from './ExportPanel';
import { DownloadVoices, VoicePanel } from './VoicePanel';
import { ScenePanel } from './ScenePanel';
import { setReadingSpeed, switchMood, switchShape } from '../editor/sceneOps';
import { useSettings } from '../store/settings';
import { ShapeIcon } from '../ui/ShapeIcon';
import { PremiumNote } from '../ui/PremiumNote';
import { IMPORT_URL, LAUNCH_CODE, openHeyCaveman } from '../data/premium';
import type { Mood, Shape } from '../types';
import { useVoice } from '../voice/voiceStore';

/** Thumbnails show one still frame: redraw them only when the video itself changes, not every frame. */
const StillScene = memo(SceneSvg);

const fmt = (frames: number) => {
  const s = Math.floor(frames / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};


export function PlayerScreen() {
  const { project, go, saveProjectFile, undo, redo, setProject, readOnly } = useApp();
  const [editing, setEditing] = useState<number | null>(null);
  const [pausedForTalk, setPausedForTalk] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [voicePanel, setVoicePanel] = useState(false);
  const [tab, setTab] = useState<'look' | 'voice'>('look');
  const voice = useVoice();
  const checkVoices = useVoice((v) => v.check);
  useEffect(() => {
    void checkVoices();
  }, [checkVoices]);
  const stage = useRef<HTMLDivElement>(null);
  const clock = useRef<{ raf: number; startAt: number; startFrame: number; stopAudio?: () => void; token: number }>({ raf: 0, startAt: 0, startFrame: 0, token: 0 });
  const tl = useMemo(() => (project ? timeline(project) : null), [project]);

  const stop = useCallback(() => {
    const c = clock.current;
    c.token++;
    cancelAnimationFrame(c.raf);
    c.stopAudio?.();
    c.stopAudio = undefined;
    setPlaying(false);
  }, []);

  const play = useCallback(
    async (from: number) => {
      if (!project || !tl) return;
      stop();
      const c = clock.current;
      const token = ++c.token;
      const start = from >= tl.total - 1 ? 0 : from;
      setPlaying(true);
      setPausedForTalk(false);
      // The picture starts at once; sound joins in sync as soon as its clips have decoded.
      c.startAt = performance.now();
      c.startFrame = start;
      const position = () => (c.startFrame + ((performance.now() - c.startAt) / 1000) * FPS) / FPS;
      void (async () => {
        try {
          const ctx = audioContext();
          await ctx.resume();
          const stopAudio = await playFrom(ctx, project, position);
          if (token !== c.token) return stopAudio();
          c.stopAudio = stopAudio;
        } catch {
          /* audio blocked or unavailable: play silently */
        }
      })();
      // Pause points: the classroom player stops after that scene for discussion (prd.md > F12.5).
      const stopAt = tl.starts.find((st, i) => i > 0 && tl.scenes[i - 1].pauseHere && st > start + 1);
      const tick = () => {
        const f = c.startFrame + ((performance.now() - c.startAt) / 1000) * FPS;
        if (stopAt !== undefined && f >= stopAt - 1) {
          setFrame(stopAt - 1);
          stop();
          setPausedForTalk(true);
          return;
        }
        if (f >= tl.total - 1) {
          setFrame(tl.total - 1);
          stop();
          return;
        }
        setFrame(Math.floor(f));
        c.raf = requestAnimationFrame(tick);
      };
      c.raf = requestAnimationFrame(tick);
    },
    [project, tl, stop],
  );

  const toggle = useCallback(() => (playing ? stop() : void play(frame)), [playing, stop, play, frame]);

  const seek = useCallback(
    (f: number) => {
      if (!tl) return;
      const target = Math.min(Math.max(0, Math.round(f)), tl.total - 1);
      const wasPlaying = playing;
      stop();
      setFrame(target);
      if (wasPlaying) void play(target);
    },
    [tl, playing, stop, play],
  );

  const at = tl ? locate(tl, frame) : { index: 0, local: 0 };
  const shown = tl ? Math.min(frame, tl.total - 1) : 0;
  const jump = useCallback((i: number) => tl && seek(tl.starts[Math.min(Math.max(i, 0), tl.starts.length - 1)]), [tl, seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, select');
      if ((e.ctrlKey || e.metaKey) && !typing && !exporting && !voicePanel) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); stop(); undo(); return; }
        if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); stop(); redo(); return; }
      }
      if ((e.target as HTMLElement)?.closest?.('[data-scene-panel]')) return;
      if (exporting || (e.target as HTMLElement)?.closest('input, textarea, select, [role=dialog]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') jump(at.index + 1);
      else if (e.key === 'ArrowLeft') jump(at.index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, jump, at.index, exporting, voicePanel, undo, redo, stop]);

  useEffect(() => stop, [stop]);

  // Stable handlers so the scene panel doesn't redraw on every video frame.
  const selectScene = useCallback((i: number) => {
    stop();
    setEditing(i);
  }, [stop]);
  const closePanel = useCallback(() => setEditing(null), []);

  // While a scene is open for editing, keep the player paused on it a moment in (drawings have popped in).
  useEffect(() => {
    if (editing === null || !tl || playing || editing >= tl.starts.length) return;
    const start = tl.starts[editing];
    const end = tl.starts[editing + 1] ?? tl.total;
    setFrame((f) => (f >= start && f < end ? f : Math.min(start + 24, end - 1)));
  }, [editing, tl, playing]);

  // No video open: go to Start after this render, never during it.
  const missing = !project || !tl;
  useEffect(() => {
    if (missing) go('start', { replace: true });
  }, [missing, go]);
  if (!project || !tl) return null;
  const editIndex = editing !== null && editing < project.scenes.length ? editing : null;
  const openScene = (i: number) => {
    seek(Math.min(tl.starts[i] + 24, (tl.starts[i + 1] ?? tl.total) - 1));
    setEditing(i < project.scenes.length ? i : null); // the end card is set in Download video
  };
  const showTab = (next: 'look' | 'voice' | 'scene') => {
    if (next === 'scene') return openScene(Math.min(at.index, project.scenes.length - 1));
    setEditing(null);
    setTab(next);
  };
  const activeTab = editIndex !== null ? 'scene' : tab;
  // Sized so the video, its controls, Download and the scene strip fit one screen (PRD PLAYER-1).
  const room = 'calc(100vh - 470px)';
  const maxWidth = project.shape === 'wide' ? `max(320px, min(100%, calc(${room} * 16 / 9)))` : project.shape === 'square' ? `max(260px, ${room})` : `max(200px, calc(${room} * 9 / 16))`;
  const chip = (on: boolean) => `flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-sm ${on ? 'border-ochre bg-sand text-[#000]' : 'border-hairline bg-bone'}`;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
      {/* On phones the column dissolves while a scene is open, so the video can stay pinned above it. */}
      <div className={`min-w-0 ${editIndex !== null ? 'max-lg:contents' : ''}`}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 max-sm:basis-full sm:flex-1">
          <Button variant="ghost" className="whitespace-nowrap px-0 py-1" onClick={() => go('start')}>
            <ArrowLeft size={18} aria-hidden="true" /> {en.player.back}
          </Button>
          <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">{project.title}</h1>
        </div>
        <Button className="max-sm:order-last" aria-label={en.player.editScenes} onClick={() => { stop(); useApp.setState({ editorStart: editIndex ?? Math.min(at.index, project.scenes.length - 1) }); go('editor'); }}>
          <PencilRuler size={18} aria-hidden="true" /> <span className="max-sm:sr-only">{en.player.editScenes}</span>
        </Button>
        <Button variant="primary" className="max-sm:flex-1" onClick={() => { stop(); setExporting(true); }}>
          <Download size={18} aria-hidden="true" /> {en.exportPanel.open}
        </Button>
      </div>

      {/* The video sits on a charcoal "slate" frame. Click to play or pause. */}
      <div
        ref={stage}
        className={`mx-auto mt-3 overflow-hidden rounded-[26px] border-[1.5px] border-black bg-charcoal ${editIndex !== null ? 'max-lg:sticky max-lg:top-2 max-lg:z-20' : ''}`}
        style={{ maxWidth }}
        data-testid="player"
        onClick={toggle}
      >
        <SceneSvg project={project} scene={tl.scenes[at.index]} frame={at.local} index={at.index} />
      </div>

      {/* Controls sit under the video, never over the caption. */}
      <div className="mx-auto mt-2 flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4" style={{ maxWidth, background: '#000', color: '#fff' }}>
        <button type="button" onClick={toggle} aria-label={playing ? en.player.pause : en.player.play} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: '#fff', color: '#000' }}>
          {playing ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
        </button>
        <div className="relative min-w-0 flex-1">
          <input
            type="range"
            aria-label="Position in the video"
            min={0}
            max={tl.total - 1}
            value={shown}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-sun"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden="true">
            {tl.starts.slice(1).map((s) => (
              <span key={s} className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-white/50" style={{ left: `${(s / tl.total) * 100}%` }} />
            ))}
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums" data-testid="time">
          {fmt(shown)} / {fmt(tl.total)}
        </span>
        <button type="button" onClick={() => void stage.current?.requestFullscreen?.()} aria-label={en.player.fullscreen} title={en.player.fullscreen} className="shrink-0">
          <Maximize size={18} aria-hidden="true" />
        </button>
      </div>

      {pausedForTalk && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border-[1.5px] border-black bg-sun px-4 py-2 font-semibold text-[#000]" role="status" data-testid="paused-for-talk">
          ✋ {en.player.pausedForTalk}
        </p>
      )}
      {voice.voicing && !voicePanel && <p className="mt-2 font-semibold" aria-live="polite">{en.voice.voicing(voice.voicing.done, voice.voicing.total)}</p>}
      <p className="mt-3 text-sm text-ash">{en.player.tip}</p>
      <ol className="mt-1 flex gap-3 overflow-x-auto pb-3 pt-1" data-testid="thumbnails">
        {tl.scenes.map((scene, i) => (
          <li key={scene.id} className="shrink-0">
            <button
              type="button"
              onClick={() => openScene(i)}
              aria-label={en.player.scene(i + 1)}
              aria-current={i === at.index ? 'true' : undefined}
              aria-expanded={i < project.scenes.length ? editIndex === i : undefined}
              className={`lift block w-36 overflow-hidden rounded-[16px] border bg-bone text-left ${i === at.index ? 'border-ochre' : 'border-charcoal'} ${editIndex === i ? 'ring-2 ring-violet ring-offset-2' : ''}`}
            >
              <StillScene project={project} scene={scene} frame={Math.min(24, sceneFrames(scene) - 1)} index={i} />
              <span className="flex items-center gap-1 truncate px-2 py-1 text-xs text-ash">
                {scene.voice.type === 'recorded' && <Mic size={12} aria-label={en.voice.recorded} />}
                {scene.voice.type === 'builtin' && <Volume2 size={12} aria-label={en.voice.builtinTag} />}
                {i + 1}. {scene.kind === 'end' ? en.player.endCard : scene.captions[0]?.text}
              </span>
            </button>
          </li>
        ))}
      </ol>
      </div>

      {/* Side card: Look, Voice and Scene tabs hold the settings (PRD PLAYER-3). */}
      <div className="mt-4 lg:sticky lg:top-4 lg:mt-0">
        <div role="tablist" aria-label={en.player.settings} className="flex gap-1 rounded-full border-2 border-charcoal bg-bone p-1">
          {(['look', 'voice', 'scene'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={activeTab === k} onClick={() => showTab(k)} className={`h-9 flex-1 rounded-full text-[13px] font-extrabold uppercase tracking-[0.03em] ${activeTab === k ? 'bg-ochre text-bone' : ''}`}>
              {k === 'scene' && editIndex !== null ? en.scenePanel.title(editIndex + 1) : en.player.tabs[k]}
            </button>
          ))}
        </div>
        {activeTab === 'look' && (
          <div role="tabpanel" className="panel mt-3 space-y-4 p-4" data-testid="look">
            <div role="group" aria-label={en.shape.label}>
              <p className="mb-2 font-display text-lg">{en.shape.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {(['wide', 'tall', 'square'] as Shape[]).map((sh) => (
                  <button key={sh} type="button" disabled={readOnly} aria-pressed={project.shape === sh} onClick={() => { stop(); setProject(switchShape(project, sh)); useSettings.getState().setDefaults({ shape: sh }); }} className={chip(project.shape === sh)}>
                    <ShapeIcon shape={sh} className="h-5 w-6" /> {en.shape[sh]}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-label={en.mood.label} className="border-t border-hairline pt-4">
              <p className="mb-2 font-display text-lg">{en.mood.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {(['bright', 'earthy', 'soft'] as Mood[]).map((m) => (
                  <button key={m} type="button" disabled={readOnly} aria-pressed={project.mood === m} onClick={() => { setProject(switchMood(project, m)); useSettings.getState().setDefaults({ mood: m }); }} className={chip(project.mood === m)}>
                    <span className="flex" aria-hidden="true">{MOODS[m].backgrounds.slice(0, 3).map((c) => <span key={c} className="-mr-1 h-3.5 w-3.5 rounded-full border border-charcoal" style={{ background: c }} />)}</span>
                    <span className="ml-1">{en.mood[m]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-label={en.player.readingSpeed} className="border-t border-hairline pt-4">
              <p className="mb-2 font-display text-lg">{en.player.readingSpeed}</p>
              <div className="flex flex-wrap gap-1.5">
                {(['slow', 'normal', 'fast'] as const).map((sp) => (
                  <button key={sp} type="button" disabled={readOnly} aria-pressed={project.readingSpeed === sp} onClick={() => { stop(); setProject(setReadingSpeed(project, sp)); useSettings.getState().setDefaults({ readingSpeed: sp }); }} className={chip(project.readingSpeed === sp)}>
                    {en.voice.speeds[sp]}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-hairline pt-4">
              <Button className="px-4 py-2" disabled={readOnly} onClick={() => { stop(); setProject(shuffle(project)); }}>
                <Shuffle size={16} aria-hidden="true" /> {en.player.shuffle}
              </Button>
              <p className="mt-2 text-sm text-ash">{en.player.shuffleHint}</p>
            </div>
            {project.caveman.style !== 'classic' && project.caveman.style !== 'cartoon' && <p className="text-sm text-ash">{en.caveman.premiumNote}</p>}
            <PremiumNote id="moreLooks" onOpen={() => { stop(); setHandoff(true); }} />
            <p className="border-t border-hairline pt-4 text-sm text-ash">
              <Save size={14} className="mr-1 inline" aria-hidden="true" />
              {en.player.savedHere}{' '}
              <button type="button" className="font-display uppercase text-terracotta underline-offset-4 hover:underline" onClick={() => saveProjectFile(project)}>{en.saveProjectFile}</button>
            </p>
          </div>
        )}
        {activeTab === 'voice' && (
          <div role="tabpanel" className="panel mt-3 space-y-4 p-4">
            {project.voiceMode === 'none' && voice.status !== 'ready' && voice.status !== 'unsupported' && (
              <div className="space-y-3" data-testid="voice-card">
                <p>{en.voice.cardText}</p>
                <DownloadVoices compact />
              </div>
            )}
            <Button onClick={() => { stop(); setVoicePanel(true); }}>
              <Volume2 size={18} aria-hidden="true" /> {en.player.voiceSettings}
            </Button>
          </div>
        )}
        {editIndex !== null && <div className="mt-3"><ScenePanel index={editIndex} onSelect={selectScene} onClose={closePanel} /></div>}
      </div>
      {exporting && <ExportPanel project={project} onClose={() => setExporting(false)} />}
      {voicePanel && <VoicePanel onClose={() => setVoicePanel(false)} />}
      {handoff && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={() => setHandoff(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="handoff-title" className="panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && setHandoff(false)}>
            <h2 id="handoff-title" className="font-display text-4xl">{en.info.handoffTitle}</h2>
            <p className="mt-2">{en.info.handoffText}</p>
            {LAUNCH_CODE && <p className="mt-3 inline-block rounded-full border-[1.5px] border-black bg-sun px-3 py-1 text-sm font-extrabold">{en.info.launchCode(LAUNCH_CODE)}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => { saveProjectFile(project); openHeyCaveman(IMPORT_URL); setHandoff(false); }}>{en.info.handoffGo}</Button>
              <Button variant="ghost" onClick={() => setHandoff(false)}>{en.caveman.cancel}</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
