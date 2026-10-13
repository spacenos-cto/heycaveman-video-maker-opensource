// Can this browser make video files? Checked before export starts (devpost/prd.md > F13 edge case 2).
import { canEncodeAudio, canEncodeVideo } from 'mediabunny';

export type Quality = '720p' | '1080p';

export function outputSize(shape: 'wide' | 'tall' | 'square', quality: Quality): { width: number; height: number } {
  const short = quality === '720p' ? 720 : 1080;
  const long = quality === '720p' ? 1280 : 1920;
  if (shape === 'wide') return { width: long, height: short };
  if (shape === 'tall') return { width: short, height: long };
  return { width: short, height: short };
}

export type Capability = { ok: true; audio: 'aac' | 'opus' | null } | { ok: false; reason: string };

export async function checkCapability(width: number, height: number): Promise<Capability> {
  if (typeof window === 'undefined' || !('VideoEncoder' in window) || !('OffscreenCanvas' in window || 'HTMLCanvasElement' in window)) {
    return { ok: false, reason: 'no-webcodecs' };
  }
  try {
    if (!(await canEncodeVideo('avc', { width, height }))) return { ok: false, reason: 'no-h264' };
  } catch {
    return { ok: false, reason: 'no-h264' };
  }
  let audio: 'aac' | 'opus' | null = null;
  try {
    if ('AudioEncoder' in window && (await canEncodeAudio('aac'))) audio = 'aac';
    else if ('AudioEncoder' in window && (await canEncodeAudio('opus'))) audio = 'opus';
  } catch {
    audio = null;
  }
  return { ok: true, audio };
}
