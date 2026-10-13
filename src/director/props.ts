// Step 5: drawings that match words in the sentence (devpost/prd.md > F6 Gets back 3).
import manifest from '../../assets/manifest.json';
import type { ManifestAsset, PropPlacement, Shape } from '../types';
import { nameMatch, tokens } from './words';

export const ASSETS = manifest.assets as ManifestAsset[];
export const PROP_ASSETS = ASSETS.filter((a) => a.kind === 'prop');
export const SETTING_ASSETS = ASSETS.filter((a) => a.kind === 'setting');

export function assetById(id: string): ManifestAsset | undefined {
  return ASSETS.find((a) => a.id === id);
}

/** Score every asset of a kind against the sentence; best first. Ties keep the earlier word. */
export function rankAssets(sentence: string, pool: ManifestAsset[]): { asset: ManifestAsset; score: number }[] {
  const words = tokens(sentence);
  const lowered = sentence.toLowerCase();
  return pool
    .map((asset, order) => {
      let score = 0;
      for (const name of asset.names) score = Math.max(score, nameMatch(name, words, lowered));
      return { asset, score, order };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
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
 * Up to two drawings for a sentence. Drawings the previous scene just showed are used only when
 * nothing else matches, so a lesson that keeps saying "food" doesn't show a burger every scene.
 */
export function chooseProps(sentence: string, shape: Shape, avoid: string[] = [], max = 2): PropPlacement[] {
  const ranked = rankAssets(sentence, PROP_ASSETS);
  const fresh = ranked.filter((r) => !avoid.includes(r.asset.id));
  const picked = (fresh.length ? fresh : ranked).slice(0, max);
  return picked.map(({ asset }, i) => ({ assetId: asset.id, ...PROP_SLOTS[shape][i], rotation: 0 }));
}
