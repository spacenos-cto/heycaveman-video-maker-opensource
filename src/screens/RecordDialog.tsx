// Recording one scene's line (devpost/prd.md > F10 Record-my-voice flow): teleprompter, 3-2-1, live
// level meter, Stop, then Play back / Re-record / Keep. The microphone is used only while recording.
import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { audioContext, playBlob } from '../audio/sounds';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { Button } from '../ui/Button';
import { MicError, openMic, recordingIsSilent, type RecorderHandle, type Recording } from '../voice/recorder';
import { keepRecording } from '../voice/voicing';

type Phase = 'ready' | 'countdown' | 'recording' | 'review' | 'error';

export function RecordDialog({ sceneIndex, onClose }: { sceneIndex: number; onClose: () => void }) {
  const { project, setProject } = useApp();
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(3);
  const [level, setLevel] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [take, setTake] = useState<Recording | null>(null);
  const handle = useRef<RecorderHandle | null>(null);
  const mic = useRef<Awaited<ReturnType<typeof openMic>> | null>(null);
  const scene = project?.scenes[sceneIndex];

  useEffect(() => () => {
    handle.current?.cancel();
    mic.current?.release();
  }, []);

  useEffect(() => {
    if (phase !== 'recording') return;
    let raf = 0;
    const tick = () => {
      setLevel(handle.current?.level() ?? 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (!project || !scene) return null;

  const stop = async (auto = false) => {
    if (!handle.current) return;
    const h = handle.current;
    handle.current = null;
    const rec = await h.stop();
    if (recordingIsSilent(rec)) {
      setNote(en.voice.silent);
      setPhase('ready');
      return;
    }
    setNote(auto ? en.voice.autoStopped : null);
    setTake(rec);
    setPhase('review');
  };

  const start = async () => {
    setNote(null);
    setTake(null);
    try {
      // Ask for the microphone only now, when Record is pressed.
      mic.current = await openMic();
    } catch (e) {
      setNote(e instanceof MicError && e.kind === 'denied' ? en.voice.micDenied : en.voice.micMissing);
      setPhase('error');
      return;
    }
    // 3-2-1, then the recording starts.
    setPhase('countdown');
    for (let n = 3; n > 0; n--) {
      setCount(n);
      await new Promise((r) => setTimeout(r, 650));
    }
    handle.current = mic.current.begin(() => void stop(true));
    mic.current = null;
    setPhase('recording');
  };

  const keep = async () => {
    if (!take) return;
    setProject(await keepRecording(project, sceneIndex, take.samples, take.sampleRate));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 sm:items-center" onClick={phase === 'recording' ? undefined : onClose}>
      <div role="dialog" aria-modal="true" aria-label={`${en.voice.record}: ${en.player.scene(sceneIndex + 1)}`} className="panel w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-ash">{en.player.scene(sceneIndex + 1)}</p>
        {/* Teleprompter: the line to read, big. */}
        <p className="mt-2 font-display text-2xl font-semibold leading-snug" data-testid="teleprompter">{scene.words}</p>

        {phase === 'countdown' && <p className="mt-6 text-center font-display text-5xl font-bold text-terracotta" aria-live="assertive">{count}</p>}

        {phase === 'recording' && (
          <div className="mt-6" aria-live="polite">
            <p className="flex items-center gap-2 font-display font-semibold text-berry">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-berry" /> {en.voice.recording}
            </p>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full border-2 border-charcoal bg-bone" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
              <div className="h-full bg-moss transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
            <Button variant="primary" className="mt-4" onClick={() => void stop()}>
              <Square size={16} fill="currentColor" aria-hidden="true" /> {en.voice.stop}
            </Button>
          </div>
        )}

        {note && <p className="mt-4 rounded-[12px] border-2 border-ochre bg-bone p-3 text-sm" role="alert">{note}</p>}

        {(phase === 'ready' || phase === 'error') && (
          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={() => void start()}>
              <Mic size={18} aria-hidden="true" /> {scene.voice.type === 'recorded' ? en.voice.rerecord : en.voice.recordScene}
            </Button>
            <Button onClick={onClose}>{en.videos.cancel}</Button>
          </div>
        )}

        {phase === 'review' && take && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void playBlob(audioContext(), take.blob)}>{en.voice.playBack}</Button>
            <Button onClick={() => void start()}>{en.voice.rerecord}</Button>
            <Button variant="primary" onClick={() => void keep()}>{en.voice.keep}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
