// Everything the video sounds like: voices (built-in or recorded) and gentle sound effects. The player
// plays these through Web Audio; the exporter mixes the very same list offline into the MP4.
import { quizRevealMs } from '../director/lesson';
import { sfxGain, sfxOffset } from '../director/sfx';
import { storage } from '../storage/db';
import type { Project } from '../types';
import { FPS, timeline } from '../video/timeline';

const rawCache = new Map<string, Promise<ArrayBuffer>>();

function rawSfx(id: string): Promise<ArrayBuffer> {
  const key = `sfx:${id}`;
  let p = rawCache.get(key);
  if (!p) {
    p = fetch(`/sfx/${id}.wav`).then((r) => {
      if (!r.ok) throw new Error(`sound ${id} missing`);
      return r.arrayBuffer();
    });
    rawCache.set(key, p);
  }
  return p;
}

function rawVoice(blobId: string): Promise<ArrayBuffer> {
  const key = `voice:${blobId}`;
  let p = rawCache.get(key);
  if (!p) {
    p = storage()
      .then((db) => db.getBlob(blobId))
      .then((b) => {
        if (!b) throw new Error('voice clip missing');
        return b.arrayBuffer();
      });
    rawCache.set(key, p);
  }
  return p;
}

export type AudioEvent = { at: number; kind: 'sfx' | 'voice'; ref: string };

/** Every sound in the video and when it starts (seconds from the start of the video). */
export function audioEvents(project: Project, exporting = false): AudioEvent[] {
  const tl = timeline(project, { exporting });
  const events: AudioEvent[] = [];
  tl.scenes.forEach((s, i) => {
    const start = tl.starts[i] / FPS;
    if (s.voice.blobId && s.voice.type !== 'none') events.push({ at: start, kind: 'voice', ref: s.voice.blobId });
    if (s.sfx && project.sfxLevel !== 'off') events.push({ at: start + sfxOffset(s.sfx), kind: 'sfx', ref: s.sfx });
    // A quiz rings a ding as the answer is revealed (prd.md > F12.2).
    if (s.kind === 'quiz' && s.quiz && project.sfxLevel !== 'off') events.push({ at: start + quizRevealMs(s) / 1000, kind: 'sfx', ref: 'ding' });
  });
  return events;
}

export const hasVoices = (p: Project) => p.scenes.some((s) => s.voice.blobId && s.voice.type !== 'none');

/** Effects sit a little lower under a voice so they never drown it out (devpost/prd.md > F11). */
export const effectsGain = (p: Project) => sfxGain(p.sfxLevel) * (hasVoices(p) ? 0.7 : 1);

export async function decodeEvent(ctx: BaseAudioContext, ev: AudioEvent): Promise<AudioBuffer> {
  const bytes = ev.kind === 'voice' ? await rawVoice(ev.ref) : await rawSfx(ev.ref);
  return ctx.decodeAudioData(bytes.slice(0)); // decodeAudioData detaches its input
}

/** Schedule all sounds from `fromSec` on a live AudioContext. Returns stop() for pause and seek. */
export async function playFrom(ctx: AudioContext, project: Project, fromSec: number): Promise<() => void> {
  const voiceGain = ctx.createGain();
  const fxGain = ctx.createGain();
  voiceGain.gain.value = 1;
  fxGain.gain.value = effectsGain(project);
  voiceGain.connect(ctx.destination);
  fxGain.connect(ctx.destination);
  const sources: AudioBufferSourceNode[] = [];
  // Decode first, then start the clock, so the first sounds aren't late.
  const decoded: { ev: AudioEvent; buffer: AudioBuffer }[] = [];
  for (const ev of audioEvents(project)) {
    try {
      const buffer = await decodeEvent(ctx, ev);
      if (ev.at + buffer.duration > fromSec) decoded.push({ ev, buffer });
    } catch {
      /* a missing clip plays as silence */
    }
  }
  const t0 = ctx.currentTime;
  for (const { ev, buffer } of decoded) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ev.kind === 'voice' ? voiceGain : fxGain);
    const delay = ev.at - fromSec;
    if (delay >= 0) src.start(t0 + delay);
    else src.start(t0, -delay); // seeking into the middle of a line
    sources.push(src);
  }
  return () => {
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        /* already finished */
      }
    }
    voiceGain.disconnect();
    fxGain.disconnect();
  };
}

/** Play one clip on its own (hear sample, play back a recording). */
export async function playBlob(ctx: AudioContext, blob: Blob): Promise<() => void> {
  const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return () => {
    try {
      src.stop();
    } catch {
      /* finished */
    }
  };
}

let shared: AudioContext | null = null;
export function audioContext(): AudioContext {
  shared ??= new AudioContext();
  return shared;
}

/** Preview one sound effect (scene panel). */
export async function playSfx(ctx: AudioContext, id: string): Promise<void> {
  const buffer = await ctx.decodeAudioData((await rawSfx(id)).slice(0));
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
}
