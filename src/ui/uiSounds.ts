// Little interface sounds, made on the fly with Web Audio (no files, works offline). Quiet by design and
// switchable in the header. These are the app's sounds; the video's own effects live in audio/sounds.ts.
import { useSettings } from '../store/settings';

let ctx: AudioContext | null = null;
let last = 0;

function out(): AudioContext | null {
  if (!useSettings.getState().uiSounds) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, { freq, to, at = 0, dur = 0.08, type = 'sine', gain = 0.05 }: { freq: number; to?: number; at?: number; dur?: number; type?: OscillatorType; gain?: number }) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(c: AudioContext, dur: number, from: number, to: number, gain: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(from, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(to, c.currentTime + dur);
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

export const ui = {
  /** A soft glassy tick for any press. */
  tap() {
    const now = performance.now();
    if (now - last < 40) return;
    last = now;
    const c = out();
    if (c) tone(c, { freq: 1800, to: 900, dur: 0.05, type: 'triangle', gain: 0.035 });
  },
  /** Something appears (a drawing, a chip turning on). */
  pop() {
    const c = out();
    if (c) tone(c, { freq: 420, to: 980, dur: 0.11, type: 'sine', gain: 0.06 });
  },
  /** Moving to another screen. */
  whoosh() {
    const c = out();
    if (c) noise(c, 0.32, 400, 3200, 0.05);
  },
  /** Done: video made, file saved, export finished. */
  success() {
    const c = out();
    if (!c) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, { freq: f, at: i * 0.07, dur: 0.32, type: 'triangle', gain: 0.045 }));
  },
  /** Something was blocked or went wrong — gentle, never scary. */
  nope() {
    const c = out();
    if (c) tone(c, { freq: 320, to: 220, dur: 0.16, type: 'sine', gain: 0.05 });
  },
};
