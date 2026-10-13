// Step 9: each scene lasts as long as its voice; without voice, as long as reading takes
// (devpost/prd.md > F6 Gets back 7, F12 Reading speed).
import { countWords } from './clean';

export const WORDS_PER_MINUTE = { slow: 110, normal: 150, fast: 190 } as const;
export const MIN_SCENE_MS = 2500;
const TAIL_MS = 600; // a beat to let the picture land

export function sceneDuration(words: string, speed: keyof typeof WORDS_PER_MINUTE, voiceMs?: number): number {
  if (voiceMs !== undefined) return Math.max(MIN_SCENE_MS, Math.round(voiceMs + TAIL_MS));
  const readMs = (countWords(words) / WORDS_PER_MINUTE[speed]) * 60_000;
  return Math.max(MIN_SCENE_MS, Math.round(readMs + TAIL_MS));
}

/** "84 words · about 35 seconds" (devpost/prd.md > F2). */
export function estimateSeconds(text: string): number {
  return Math.round((countWords(text) / WORDS_PER_MINUTE.normal) * 60);
}
