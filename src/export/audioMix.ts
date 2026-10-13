// Mix every sound in the video into one audio track for the MP4 (devpost/spec.md > Export (F13)).
import { decode, sfxEvents } from '../audio/sounds';
import { sfxGain } from '../director/sfx';
import type { Project } from '../types';

export const SAMPLE_RATE = 48000;

export async function mixAudio(project: Project, durationSec: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(durationSec * SAMPLE_RATE)), SAMPLE_RATE);
  const gain = ctx.createGain();
  gain.gain.value = sfxGain(project.sfxLevel);
  gain.connect(ctx.destination);
  const events = sfxEvents(project);
  const buffers = new Map<string, AudioBuffer>();
  for (const id of new Set(events.map((e) => e.id))) buffers.set(id, await decode(ctx, id));
  for (const ev of events) {
    if (ev.at >= durationSec) continue;
    const src = ctx.createBufferSource();
    src.buffer = buffers.get(ev.id)!;
    src.connect(gain);
    src.start(ev.at);
  }
  return ctx.startRendering();
}
