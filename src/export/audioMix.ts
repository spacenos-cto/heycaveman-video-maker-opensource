// Mix every sound in the video (voices and effects) into one audio track for the MP4,
// using the same event list the player uses (devpost/spec.md > Export (F13)).
import { audioEvents, decodeEvent, effectsGain } from '../audio/sounds';
import type { Project } from '../types';

export const SAMPLE_RATE = 48000;

export async function mixAudio(project: Project, durationSec: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(durationSec * SAMPLE_RATE)), SAMPLE_RATE);
  const voiceGain = ctx.createGain();
  const fxGain = ctx.createGain();
  fxGain.gain.value = effectsGain(project);
  voiceGain.connect(ctx.destination);
  fxGain.connect(ctx.destination);
  for (const ev of audioEvents(project)) {
    if (ev.at >= durationSec) continue;
    try {
      const src = ctx.createBufferSource();
      src.buffer = await decodeEvent(ctx, ev);
      src.connect(ev.kind === 'voice' ? voiceGain : fxGain);
      src.start(ev.at);
    } catch {
      /* missing clip: silence */
    }
  }
  return ctx.startRendering();
}
