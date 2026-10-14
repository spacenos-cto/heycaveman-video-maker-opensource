// The offline director: plain text in, a scene plan out. Pure functions, no AI, no I/O.
// See devpost/spec.md > The director (F6).
import type { Mood, Project, Scene, Shape } from '../types';
import { act } from './act';
import { makeCaption } from './caption';
import { clean, countWords } from './clean';
import { chooseProps, rankAssets, PROP_ASSETS } from './props';
import { hashText, seededRandom } from './random';
import { chooseBackground } from './setting';
import { chooseSfx } from './sfx';
import { split } from './split';
import { group } from './group';
import { sceneDuration } from './timing';

export type DirectOptions = {
  seed?: number;
  shape: Shape;
  mood: Mood;
  readingSpeed: 'slow' | 'normal' | 'fast';
};

export function direct(text: string, options: DirectOptions): { scenes: Scene[]; seed: number; removedLinks: number } {
  const cleaned = clean(text);
  const seed = options.seed ?? hashText(cleaned.text);
  const rnd = seededRandom(seed);
  const pieces = group(split(cleaned.text));

  const scenes: Scene[] = [];
  pieces.forEach((words, i) => {
    const previous = scenes[i - 1];
    const acting = act(words, previous?.motion, rnd);
    const props = chooseProps(words, options.shape, previous?.props.map((p) => p.assetId));
    const firstMatch = rankAssets(words, PROP_ASSETS)[0]?.asset.names.find((n) => !n.includes(' '))?.replace('*', '');
    scenes.push({
      id: `s${i + 1}-${(seed + i).toString(36)}`,
      kind: 'line',
      words,
      captions: [makeCaption(words, firstMatch)],
      motion: acting.motion,
      expression: acting.expression,
      background: chooseBackground(words, previous?.background, options.mood, rnd),
      props,
      sfx: chooseSfx({ words, props }, i),
      durationMs: sceneDuration(words, options.readingSpeed),
      voice: { type: 'none' },
    });
  });
  return { scenes, seed, removedLinks: cleaned.removedLinks };
}

/** Title for My videos: the first sentence, shortened. */
export function titleFrom(text: string): string {
  const first = clean(text).text.split(/(?<=[.!?])\s/)[0] ?? '';
  const words = first.replace(/[.!?]+$/, '').split(/\s+/).slice(0, 8).join(' ');
  return words || 'Untitled lesson';
}

export function newProject(text: string, base: Pick<Project, 'shape' | 'mood' | 'caveman' | 'readingSpeed'> & Partial<Pick<Project, 'sfxLevel' | 'endCard'>>): Project {
  const { scenes, seed } = direct(text, { shape: base.shape, mood: base.mood, readingSpeed: base.readingSpeed });
  const now = Date.now();
  return {
    id: `p${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    formatVersion: 1,
    title: titleFrom(text),
    shape: base.shape,
    mood: base.mood,
    caveman: base.caveman,
    scenes,
    seed,
    voiceMode: 'none',
    sfxLevel: base.sfxLevel ?? 'gentle',
    readingSpeed: base.readingSpeed,
    endCard: base.endCard ?? true,
    sourceText: text,
    createdAt: now,
    updatedAt: now,
  };
}

export { countWords };
