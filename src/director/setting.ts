// Step 6: the background. A setting drawing stays until the story moves somewhere new;
// otherwise a mood colour that never repeats the previous scene's (devpost/prd.md > F6, projector rules).
import type { Background, Mood } from '../types';
import { MOODS } from '../video/moods';
import { rankAssets, SETTING_ASSETS } from './props';

export function detectSetting(sentence: string): string | undefined {
  return rankAssets(sentence, SETTING_ASSETS)[0]?.asset.id;
}

export function chooseBackground(
  sentence: string,
  previous: Background | undefined,
  mood: Mood,
  rnd: () => number,
): Background {
  const place = detectSetting(sentence);
  if (place) return { type: 'setting', assetId: place };
  if (previous?.type === 'setting') return previous; // the story hasn't moved
  const palette = MOODS[mood].backgrounds;
  const prevColor = previous?.type === 'color' ? previous.color : undefined;
  const options = palette.filter((c) => c !== prevColor);
  return { type: 'color', color: options[Math.floor(rnd() * options.length) % options.length] };
}
