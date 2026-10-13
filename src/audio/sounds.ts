// Sound effects for the player (Web Audio) and the exporter (OfflineAudioContext).
// The bundled WAVs are decoded once and cached; nothing is fetched from anywhere but this app.
import { sfxGain, sfxOffset } from '../director/sfx';
import type { Project } from '../types';
import { FPS, timeline } from '../video/timeline';

const rawCache = new Map<string, Promise<ArrayBuffer>>();

function raw(id: string): Promise<ArrayBuffer> {
  let p = rawCache.get(id);
  if (!p) {
    p = fetch(`/sfx/${id}.wav`).then((r) => {
      if (!r.ok) throw new Error(`sound ${id} missing`);
      return r.arrayBuffer();
    });
    rawCache.set(id, p);
  }
  return p;
}

export async function decode(ctx: BaseAudioContext, id: string): Promise<AudioBuffer> {
  // decodeAudioData detaches its input, so give it a copy.
  return ctx.decodeAudioData((await raw(id)).slice(0));
}

/** Every effect in the video: when (seconds from the start) and which sound. */
export function sfxEvents(project: Project): { at: number; id: string }[] {
  if (project.sfxLevel === 'off') return [];
  const tl = timeline(project);
  return tl.scenes.flatMap((s, i) => (s.sfx ? [{ at: tl.starts[i] / FPS + sfxOffset(s.sfx), id: s.sfx }] : []));
}

/** Schedule effects on a live AudioContext from `fromSec` onwards. Returns a stop() for pause/seek. */
export async function playSfxFrom(ctx: AudioContext, project: Project, fromSec: number): Promise<() => void> {
  const gain = ctx.createGain();
  gain.gain.value = sfxGain(project.sfxLevel);
  gain.connect(ctx.destination);
  const sources: AudioBufferSourceNode[] = [];
  let stopped = false;
  const events = sfxEvents(project).filter((ev) => ev.at >= fromSec - 0.05);
  // Decode first, then start the clock, so early effects aren't late.
  const buffers = new Map<string, AudioBuffer>();
  for (const id of new Set(events.map((e) => e.id))) buffers.set(id, await decode(ctx, id));
  const t0 = ctx.currentTime;
  for (const ev of events) {
    if (stopped) break;
    const src = ctx.createBufferSource();
    src.buffer = buffers.get(ev.id)!;
    src.connect(gain);
    src.start(t0 + Math.max(0, ev.at - fromSec));
    sources.push(src);
  }
  return () => {
    stopped = true;
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        /* already finished */
      }
    }
    gain.disconnect();
  };
}
