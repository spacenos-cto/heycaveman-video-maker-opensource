// Step 5: drawings that match words in the sentence (devpost/prd.md > F6 Gets back 3).
import manifest from '../../assets/manifest.json';
import type { ManifestAsset, PropPlacement, Shape } from '../types';
import { matchName, tokens } from './words';

export const ASSETS = manifest.assets as ManifestAsset[];
export const PROP_ASSETS = ASSETS.filter((a) => a.kind === 'prop');
export const SETTING_ASSETS = ASSETS.filter((a) => a.kind === 'setting');

export function assetById(id: string): ManifestAsset | undefined {
  return ASSETS.find((a) => a.id === id);
}

/**
 * Score every asset of a kind against the sentence; best first. 2 = the sentence names it, 1 = only a
 * weak hint (see WEAK_NAMES). Ties go to the word that comes first in the sentence.
 */
export function rankAssets(sentence: string, pool: ManifestAsset[]): { asset: ManifestAsset; score: number }[] {
  const words = tokens(sentence);
  const lowered = sentence.toLowerCase();
  return pool
    .map((asset, order) => {
      let score = 0;
      let at = Infinity;
      for (const name of asset.names) {
        const m = matchName(name, words, lowered);
        if (m.strength > score || (m.strength === score && m.strength > 0 && m.at < at)) {
          score = m.strength;
          at = m.at;
        }
      }
      return { asset, score, at, order };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.at - b.at || a.order - b.order)
    .map(({ asset, score }) => ({ asset, score }));
}

/** Where props sit, beside the caveman, per video shape. Percentages of the frame. */
export const PROP_SLOTS: Record<Shape, { x: number; y: number; scale: number }[]> = {
  wide: [
    { x: 66, y: 44, scale: 34 },
    { x: 84, y: 54, scale: 26 },
  ],
  square: [
    { x: 70, y: 40, scale: 28 },
    { x: 70, y: 66, scale: 20 },
  ],
  tall: [
    { x: 50, y: 22, scale: 18 },
    { x: 74, y: 30, scale: 12 },
  ],
};

/**
 * Up to two drawings for a sentence. Things the sentence names come first; a weak hint ("day",
 * "food") brings one drawing only when nothing is named, so a wrong drawing never sits beside a right one.
 * Drawings the previous scene just showed are skipped when there is something new, but a lesson's own
 * topic ("plants" again) may repeat rather than give way to a weak hint.
 */
export function chooseProps(sentence: string, shape: Shape, avoid: string[] = [], max = 2): PropPlacement[] {
  const ranked = rankAssets(sentence, PROP_ASSETS);
  const named = ranked.filter((r) => r.score === 2);
  const hints = ranked.filter((r) => r.score < 2);
  const fresh = (list: typeof ranked) => list.filter((r) => !avoid.includes(r.asset.id));
  const picked = fresh(named).length ? fresh(named).slice(0, max) : named.length ? named.slice(0, max) : (fresh(hints).length ? fresh(hints) : hints).slice(0, 1);
  return picked.map(({ asset }, i) => ({ assetId: asset.id, ...PROP_SLOTS[shape][i], rotation: 0 }));
}
