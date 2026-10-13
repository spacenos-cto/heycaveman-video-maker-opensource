// Step 8: gentle sound effects (devpost/prd.md > F6 Gets back 5, F11). One main effect per scene:
// a ding on a key fact, else a pop when a drawing appears, else a whoosh on the scene change.
import type { Scene } from '../types';

export const SFX_FILES = ['blip', 'boing', 'click', 'coin', 'ding', 'pop', 'pow', 'riser', 'sparkle', 'whoosh'] as const;
export type SfxId = (typeof SFX_FILES)[number];

const KEY_FACT = /\b(remember|important|key|fact|that's why|in short|so remember)\b/i;

export function chooseSfx(scene: Pick<Scene, 'words' | 'props'>, index: number): SfxId | undefined {
  if (KEY_FACT.test(scene.words)) return 'ding';
  if (scene.props.length) return 'pop';
  if (index > 0) return 'whoosh';
  return undefined;
}

/** When the effect sounds, in seconds after the scene starts (pops land with the drawing). */
export function sfxOffset(id: string): number {
  return id === 'pop' ? 0.15 : id === 'ding' ? 0.35 : 0;
}

/** Volume per Sound effects setting; Gentle never drowns out a voice. */
export function sfxGain(level: 'on' | 'gentle' | 'off'): number {
  return level === 'off' ? 0 : level === 'gentle' ? 0.35 : 0.7;
}
