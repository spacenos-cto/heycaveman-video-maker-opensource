// Shuffle (devpost/prd.md > F6 Edge case 1, F7): re-roll poses, drawings and colours for variety. The words,
// captions, voices and anything placed by hand stay exactly as they are.
import type { Project, Scene } from '../types';
import { MOODS } from '../video/moods';
import { act } from './act';
import { PROP_ASSETS, PROP_SLOTS, rankAssets } from './props';
import { seededRandom } from './random';

export function shuffle(project: Project, seed = Math.floor(Math.random() * 2 ** 31)): Project {
  const rnd = seededRandom(seed);
  const palette = MOODS[project.mood].backgrounds;
  const slots = PROP_SLOTS[project.shape];
  const scenes: Scene[] = [];
  for (const s of project.scenes) {
    const prev = scenes[scenes.length - 1];
    if (s.kind !== 'line') {
      scenes.push(s);
      continue;
    }
    const acting = act(s.words, prev?.motion, rnd);
    // Drawings still in the director's spots get a fresh pick among the drawings that match the words.
    const auto = s.props.every((p, i) => slots[i] && p.x === slots[i].x && p.y === slots[i].y && p.scale === slots[i].scale);
    let props = s.props;
    if (auto && s.props.length) {
      const pool = rankAssets(s.words, PROP_ASSETS).slice(0, 5).map((r) => r.asset.id);
      const picked = [...pool].sort(() => rnd() - 0.5).slice(0, s.props.length);
      props = picked.map((assetId, i) => ({ assetId, ...slots[i], rotation: 0 }));
    }
    let background = s.background;
    if (background.type === 'color' && !background.manual) {
      const prevColor = prev?.background.type === 'color' ? prev.background.color : undefined;
      const options = palette.filter((c) => c !== prevColor);
      background = { type: 'color', color: options[Math.floor(rnd() * options.length) % options.length] };
    }
    scenes.push({ ...s, motion: acting.motion, expression: acting.expression, props, background });
  }
  return { ...project, scenes, seed, updatedAt: Date.now() };
}
