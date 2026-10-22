// Voice (devpost/prd.md > F10): Caveman voices (one-time download, then offline), Record my voice,
// or No voice. Mixed voices per scene are allowed; each scene shows which kind it has.
import { useEffect, useState } from 'react';
import { Mic, Volume2, X } from 'lucide-react';
import { audioContext, playBlob } from '../audio/sounds';
import { en } from '../i18n/en';
import { useApp } from '../store/app';
import { Button } from '../ui/Button';
import { encodeWav } from '../voice/envelope';
import { loadVoices, speak } from '../voice/voiceClient';
import { DEFAULT_VOICE, useVoice } from '../voice/voiceStore';
import { removeVoices, speakable, SPEEDS } from '../voice/voicing';
import { RecordDialog } from './RecordDialog';
import { useSettings } from '../store/settings';

type Mode = 'builtin' | 'recorded' | 'none';

export function DownloadVoices({ compact = false }: { compact?: boolean }) {
  const { status, progress, download, error } = useVoice();
  if (status === 'unsupported') return <p className="text-sm">{en.voice.unsupported}</p>;
  if (status === 'downloading')
    return (
      <div aria-live="polite">
        <p className="text-sm font-semibold" data-testid="voice-download">{en.voice.downloading(progress)}</p>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full border-2 border-charcoal bg-bone" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Voice download">
          <div className="h-full bg-river" style={{ width: `${progress}%` }} />
        </div>
        {!compact && <p className="mt-1 text-xs text-ash">{en.voice.keepWatching}</p>}
      </div>
    );
  if (status === 'failed')
    return (
      <div role="alert">
        <p className="text-sm text-berry">{en.voice.failed}</p>
        {error && <details className="mt-1 text-xs text-ash"><summary>{en.making.details}</summary>{error}</details>}
        <Button className="mt-2" onClick={() => void download()}>{en.making.tryAgain}</Button>
      </div>
    );
  if (status === 'not-downloaded')
    return (
      <Button variant="primary" onClick={() => void download()}>
        <Volume2 size={18} aria-hidden="true" /> {en.voice.download}
      </Button>
    );
  return null;
}

export function VoicePanel({ onClose }: { onClose: () => void }) {
  const { project, setProject } = useApp();
  const voice = useVoice();
  const [mode, setMode] = useState<Mode>(project?.voiceMode ?? 'none');
  const [voiceId, setVoiceId] = useState(project?.voiceId ?? DEFAULT_VOICE);
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>(project?.voiceSpeed ?? 'normal');
  const [recording, setRecording] = useState<number | null>(null);

  const check = useVoice((v) => v.check);
  const status = useVoice((v) => v.status);
  useEffect(() => void check(), [check]);
  // Warm up the voice engine while the person chooses, so "Voice my video" starts right away.
  useEffect(() => {
    if (status === 'ready') void loadVoices().catch(() => undefined);
  }, [status]);
  if (!project) return null;

  const sample = async () => {
    const { samples, sampleRate } = await speak(en.voice.sampleText, voiceId, SPEEDS[speed]);
    await playBlob(audioContext(), encodeWav(samples, sampleRate));
  };

  const choice = (m: Mode, title: string, hint: string) => (
    <label className={`flex cursor-pointer items-start gap-3 rounded-[12px] border-2 p-3 ${mode === m ? 'border-ochre bg-sand' : 'border-hairline'}`}>
      <input type="radio" name="voice-mode" checked={mode === m} onChange={() => setMode(m)} className="mt-1 accent-violet" />
      <span>
        <span className="font-display font-semibold">{title}</span>
        <span className="block text-sm text-ash">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="voice-title" className="panel max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <div className="flex items-start justify-between">
          <h2 id="voice-title" className="font-display text-2xl font-bold">{en.voice.title}</h2>
          <button type="button" onClick={onClose} aria-label={en.exportPanel.close} className="rounded-[12px] p-1"><X size={22} aria-hidden="true" /></button>
        </div>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">{en.voice.button}</legend>
          {choice('builtin', en.voice.builtin, en.voice.builtinHint)}
          {choice('recorded', en.voice.record, en.voice.recordHint)}
          {choice('none', en.voice.none, en.voice.noneHint)}
        </fieldset>

        {mode === 'builtin' && (
          <div className="mt-5 space-y-4">
            <DownloadVoices />
            {voice.status === 'ready' && (
              <>
                <p className="text-sm text-moss">{en.voice.ready}</p>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="text-sm">
                    <span className="block font-display font-semibold">{en.voice.pick}</span>
                    <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="mt-1 rounded-[10px] border-2 border-charcoal bg-bone px-2 py-1.5">
                      {(voice.voices.length ? voice.voices : [{ id: DEFAULT_VOICE, name: 'Heart', language: 'en-us', gender: 'Female', grade: '' }]).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.language.toLowerCase() === 'en-gb' ? 'UK' : 'US'}, {v.gender.toLowerCase()})
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="text-sm">
                    <legend className="font-display font-semibold">{en.voice.speed}</legend>
                    <div className="mt-1 flex gap-2">
                      {(Object.keys(SPEEDS) as (keyof typeof SPEEDS)[]).map((s) => (
                        <label key={s} className={`cursor-pointer rounded-full border-2 px-3 py-1 ${speed === s ? 'border-ochre bg-sand' : 'border-hairline'}`}>
                          <input type="radio" name="speed" className="sr-only" checked={speed === s} onChange={() => setSpeed(s)} />
                          {en.voice.speeds[s]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Button onClick={() => void sample()}>
                    <Volume2 size={16} aria-hidden="true" /> {en.voice.sample}
                  </Button>
                </div>
                {voice.error && (
                  <p className="text-sm text-berry" role="alert" data-testid="voice-error">
                    {en.voice.failed} <span className="block text-xs text-ash">{voice.error}</span>
                  </p>
                )}
                {voice.voicing ? (
                  <p className="font-semibold" aria-live="polite" data-testid="voicing">{en.voice.voicing(voice.voicing.done, voice.voicing.total)}</p>
                ) : (
                  <Button variant="primary" onClick={() => void voice.voiceOpenProject(voiceId, speed)}>{en.voice.voiceAll}</Button>
                )}
              </>
            )}
          </div>
        )}

        {mode === 'recorded' && (
          <ol className="mt-5 space-y-2">
            {project.scenes.map((s, i) =>
              speakable(s) ? (
                <li key={s.id} className="flex items-center gap-3 rounded-[12px] border border-hairline p-2">
                  <span className="w-8 shrink-0 text-center font-display font-semibold text-ash">{i + 1}</span>
                  <span className="flex-1 text-sm">{s.words}</span>
                  {s.voice.type === 'recorded' && <span className="text-xs text-moss">✓ {en.voice.recorded}</span>}
                  <Button className="px-3 py-1.5 text-sm" onClick={() => setRecording(i)}>
                    <Mic size={16} aria-hidden="true" /> {s.voice.type === 'recorded' ? en.voice.rerecord : en.voice.recordScene}
                  </Button>
                </li>
              ) : null,
            )}
          </ol>
        )}

        {mode === 'none' && (
          <Button className="mt-5" onClick={() => { setProject(removeVoices(project)); onClose(); }}>{en.voice.useNone}</Button>
        )}

        <fieldset className="mt-6 border-t border-hairline pt-4 text-sm">
          <legend className="sr-only">{en.voice.sfx}</legend>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={en.voice.sfx}>
            <span className="mr-1 font-semibold">{en.voice.sfx}</span>
            {(['on', 'gentle', 'off'] as const).map((lv) => (
              <button key={lv} type="button" aria-pressed={project.sfxLevel === lv} onClick={() => { setProject({ ...project, sfxLevel: lv, updatedAt: Date.now() }); useSettings.getState().setDefaults({ sfxLevel: lv }); }} className={`rounded-full border-[1.5px] px-3 py-1 ${project.sfxLevel === lv ? 'border-black bg-sand' : 'border-hairline bg-bone'}`}>
                {en.voice.sfxLevels[lv]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 text-right">
          <Button onClick={onClose}>{en.voice.close}</Button>
        </div>
      </div>
      {recording !== null && <RecordDialog sceneIndex={recording} onClose={() => setRecording(null)} />}
    </div>
  );
}
