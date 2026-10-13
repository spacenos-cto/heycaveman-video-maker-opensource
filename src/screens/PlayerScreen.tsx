// Watch the video (devpost/prd.md > F7). Our own player: a frame clock draws the current scene's SVG
// about 30 times a second, sounds play through Web Audio, and the same SVG becomes the MP4 on export.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Maximize, Mic, Pause, Play, Save, Volume2 } from 'lucide-react';
import { audioContext, playFrom } from '../audio/sounds';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { Button } from '../ui/Button';
import { SceneSvg } from '../video/SceneSvg';
import { FPS, locate, sceneFrames, timeline } from '../video/timeline';
import { ExportPanel } from './ExportPanel';
import { DownloadVoices, VoicePanel } from './VoicePanel';
import { useVoice } from '../voice/voiceStore';
import { storage } from '../storage/db';

const fmt = (frames: number) => {
  const s = Math.floor(frames / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};


export function PlayerScreen() {
  const { project, go, saveProjectFile } = useApp();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [voicePanel, setVoicePanel] = useState(false);
  const voice = useVoice();
  const checkVoices = useVoice((v) => v.check);
  const [cardDismissed, setCardDismissed] = useState(true);
  useEffect(() => {
    void checkVoices();
    void storage().then((db) => db.getSetting<Record<string, true>>('seenTips')).then((t) => setCardDismissed(!!t?.voiceCard));
  }, [checkVoices]);
  const dismissCard = () => {
    setCardDismissed(true);
    void storage().then(async (db) => db.putSetting('seenTips', { ...((await db.getSetting<Record<string, true>>('seenTips')) ?? {}), voiceCard: true }));
  };
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
      try {
        const ctx = audioContext();
        await ctx.resume();
        const stopAudio = await playFrom(ctx, project, start / FPS);
        if (token !== c.token) return stopAudio();
        c.stopAudio = stopAudio;
      } catch {
        /* audio blocked or unavailable: play silently */
      }
      if (token !== c.token) return;
      c.startAt = performance.now();
      c.startFrame = start;
      const tick = () => {
        const f = c.startFrame + ((performance.now() - c.startAt) / 1000) * FPS;
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
  const jump = useCallback((i: number) => tl && seek(tl.starts[Math.min(Math.max(i, 0), tl.starts.length - 1)]), [tl, seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exporting || (e.target as HTMLElement)?.closest('input, textarea, select, [role=dialog]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') jump(at.index + 1);
      else if (e.key === 'ArrowLeft') jump(at.index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, jump, at.index, exporting]);

  useEffect(() => stop, [stop]);

  if (!project || !tl) {
    go('start');
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6">
      <Button variant="ghost" className="px-0" onClick={() => go('start')}>
        <ArrowLeft size={18} aria-hidden="true" /> {en.player.back}
      </Button>
      <h1 className="mt-2 font-display text-2xl font-bold">{project.title}</h1>

      {/* The video sits on a charcoal "slate" frame. Click to play or pause. */}
      <div
        ref={stage}
        className="mx-auto mt-4 overflow-hidden rounded-[14px] border-2 border-charcoal bg-charcoal"
        style={{ maxWidth: project.shape === 'wide' ? '100%' : project.shape === 'square' ? '70vh' : '40vh' }}
        data-testid="player"
        onClick={toggle}
      >
        <SceneSvg project={project} scene={tl.scenes[at.index]} frame={at.local} index={at.index} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={toggle} aria-label={playing ? en.player.pause : en.player.play}>
          {playing ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
          {playing ? en.player.pause : en.player.play}
        </Button>
        <div className="relative min-w-[200px] flex-1">
          <input
            type="range"
            aria-label="Position in the video"
            min={0}
            max={tl.total - 1}
            value={frame}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-[#E8892B]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden="true">
            {tl.starts.slice(1).map((s) => (
              <span key={s} className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-charcoal/50" style={{ left: `${(s / tl.total) * 100}%` }} />
            ))}
          </div>
        </div>
        <span className="font-display tabular-nums text-ash" data-testid="time">
          {fmt(frame)} / {fmt(tl.total)}
        </span>
        <Button onClick={() => void stage.current?.requestFullscreen?.()} aria-label={en.player.fullscreen}>
          <Maximize size={18} aria-hidden="true" /> {en.player.fullscreen}
        </Button>
        <Button onClick={() => { stop(); setVoicePanel(true); }}>
          <Volume2 size={18} aria-hidden="true" /> {en.voice.button}
        </Button>
        <Button onClick={() => project && saveProjectFile(project)}>
          <Save size={18} aria-hidden="true" /> {en.saveProjectFile}
        </Button>
        <Button variant="primary" onClick={() => { stop(); setExporting(true); }}>
          <Download size={18} aria-hidden="true" /> {en.exportPanel.open}
        </Button>
      </div>

      {project.voiceMode === 'none' && !cardDismissed && voice.status !== 'ready' && voice.status !== 'unsupported' && (
        <div className="panel mt-4 flex flex-wrap items-center gap-3 p-4" data-testid="voice-card">
          <Volume2 size={22} aria-hidden="true" className="text-terracotta" />
          <p className="flex-1">{en.voice.cardText}</p>
          <DownloadVoices compact />
          {voice.status === 'not-downloaded' && <Button variant="ghost" onClick={dismissCard}>{en.voice.notNow}</Button>}
        </div>
      )}
      {voice.voicing && !voicePanel && <p className="mt-3 font-semibold" aria-live="polite">{en.voice.voicing(voice.voicing.done, voice.voicing.total)}</p>}
      <p className="mt-4 text-sm text-ash">{en.player.tip}</p>
      <ol className="mt-2 flex gap-3 overflow-x-auto pb-3" data-testid="thumbnails">
        {tl.scenes.map((scene, i) => (
          <li key={scene.id} className="shrink-0">
            <button
              type="button"
              onClick={() => jump(i)}
              aria-label={en.player.scene(i + 1)}
              aria-current={i === at.index ? 'true' : undefined}
              className={`block w-40 overflow-hidden rounded-[12px] border-2 bg-bone text-left ${i === at.index ? 'border-ochre' : 'border-charcoal'}`}
            >
              <SceneSvg project={project} scene={scene} frame={Math.min(24, sceneFrames(scene) - 1)} index={i} />
              <span className="flex items-center gap-1 truncate px-2 py-1 text-xs text-ash">
                {scene.voice.type === 'recorded' && <Mic size={12} aria-label={en.voice.recorded} />}
                {scene.voice.type === 'builtin' && <Volume2 size={12} aria-label={en.voice.builtinTag} />}
                {i + 1}. {scene.kind === 'end' ? en.player.endCard : scene.captions[0]?.text}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {exporting && <ExportPanel project={project} onClose={() => setExporting(false)} />}
      {voicePanel && <VoicePanel onClose={() => setVoicePanel(false)} />}
    </main>
  );
}
