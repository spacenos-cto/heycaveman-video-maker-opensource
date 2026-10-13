// Watch the video (devpost/prd.md > F7): our own controls around Remotion's Player, a scrub bar with
// scene markers and a row of scene thumbnails. The same LessonVideo composition later exports to MP4.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, Thumbnail, type PlayerRef } from '@remotion/player';
import { ArrowLeft, Maximize, Pause, Play } from 'lucide-react';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { Button } from '../ui/Button';
import { FPS, LessonVideo, SIZES, sceneFrames, timeline } from '../video/LessonVideo';

const fmt = (frames: number) => {
  const s = Math.floor(frames / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function PlayerScreen() {
  const { project, go } = useApp();
  const player = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { starts, total } = useMemo(() => (project ? timeline(project) : { starts: [], total: 1 }), [project]);
  const size = project ? SIZES[project.shape] : SIZES.wide;
  const inputProps = useMemo(() => ({ project: project! }), [project]);
  const sceneIndex = Math.max(0, starts.findLastIndex((s) => s <= frame));

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    p.addEventListener('ended', onPause);
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
      p.removeEventListener('ended', onPause);
    };
  }, [project]);

  const jump = useCallback(
    (i: number) => {
      const target = starts[Math.min(Math.max(i, 0), starts.length - 1)] ?? 0;
      player.current?.seekTo(target);
      setFrame(target);
    },
    [starts],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === ' ') {
        e.preventDefault();
        player.current?.toggle();
      } else if (e.key === 'ArrowRight') jump(sceneIndex + 1);
      else if (e.key === 'ArrowLeft') jump(sceneIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump, sceneIndex]);

  if (!project) {
    go('start');
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6">
      <Button variant="ghost" className="px-0" onClick={() => go('start')}>
        <ArrowLeft size={18} aria-hidden="true" /> {en.player.back}
      </Button>
      <h1 className="mt-2 font-display text-2xl font-bold">{project.title}</h1>

      {/* The video sits on a charcoal "slate" frame. */}
      <div className="mt-4 overflow-hidden rounded-[14px] border-2 border-charcoal bg-charcoal" data-testid="player">
        <Player
          ref={player}
          component={LessonVideo}
          inputProps={inputProps}
          durationInFrames={total}
          compositionWidth={size.width}
          compositionHeight={size.height}
          fps={FPS}
          controls={false}
          clickToPlay
          style={{ width: '100%', aspectRatio: `${size.width} / ${size.height}`, maxHeight: '70vh' }}
          acknowledgeRemotionLicense
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => player.current?.toggle()} aria-label={playing ? en.player.pause : en.player.play}>
          {playing ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
          {playing ? en.player.pause : en.player.play}
        </Button>
        <div className="relative min-w-[200px] flex-1">
          <input
            type="range"
            aria-label="Position in the video"
            min={0}
            max={total - 1}
            value={frame}
            onChange={(e) => {
              const f = Number(e.target.value);
              player.current?.seekTo(f);
              setFrame(f);
            }}
            className="w-full accent-[#E8892B]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden="true">
            {starts.slice(1).map((s) => (
              <span key={s} className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-charcoal/50" style={{ left: `${(s / total) * 100}%` }} />
            ))}
          </div>
        </div>
        <span className="font-display tabular-nums text-ash" data-testid="time">
          {fmt(frame)} / {fmt(total)}
        </span>
        <Button onClick={() => player.current?.requestFullscreen()} aria-label={en.player.fullscreen}>
          <Maximize size={18} aria-hidden="true" /> {en.player.fullscreen}
        </Button>
      </div>

      <p className="mt-4 text-sm text-ash">{en.player.tip}</p>
      <ol className="mt-2 flex gap-3 overflow-x-auto pb-3" data-testid="thumbnails">
        {project.scenes.map((scene, i) => (
          <li key={scene.id} className="shrink-0">
            <button
              type="button"
              onClick={() => jump(i)}
              aria-label={en.player.scene(i + 1)}
              aria-current={i === sceneIndex ? 'true' : undefined}
              className={`block w-40 overflow-hidden rounded-[12px] border-2 bg-bone text-left ${i === sceneIndex ? 'border-ochre' : 'border-charcoal'}`}
            >
              <Thumbnail
                component={LessonVideo}
                inputProps={inputProps}
                compositionWidth={size.width}
                compositionHeight={size.height}
                durationInFrames={total}
                frameToDisplay={starts[i] + Math.min(18, sceneFrames(scene) - 1)}
                fps={FPS}
                style={{ width: '100%' }}
              />
              <span className="block px-2 py-1 text-xs text-ash">
                {i + 1}. {scene.captions[0]?.text}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </main>
  );
}
