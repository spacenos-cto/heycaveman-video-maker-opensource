// Turns a voice clip into what the video needs: a WAV file to keep, its length, and a loudness value
// per video frame that drives the caveman's mouth (devpost/spec.md > The caveman rig: lip-sync).
import { FPS } from '../video/timeline';

/** Loudness per video frame, 0..1, smoothed so the mouth doesn't flicker. */
export function loudnessEnvelope(samples: Float32Array, sampleRate: number, fps = FPS): number[] {
  const per = sampleRate / fps;
  const frames = Math.ceil(samples.length / per);
  const raw: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const start = Math.floor(f * per);
    const end = Math.min(samples.length, Math.floor((f + 1) * per));
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    raw.push(Math.sqrt(sum / Math.max(1, end - start)));
  }
  const peak = Math.max(0.02, ...raw);
  return raw.map((v, i) => {
    const prev = raw[i - 1] ?? v;
    const value = Math.min(1, ((v + prev) / 2 / peak) * 1.15);
    return value < 0.12 ? 0 : Math.round(value * 100) / 100;
  });
}

/** Whole-clip loudness, to catch a silent recording before it's kept (devpost/prd.md > F10 edge case 4). */
export function isSilent(samples: Float32Array): boolean {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length)) < 0.004;
}

/** Mono 16-bit WAV, the format kept in the project and inside .caveman files. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
