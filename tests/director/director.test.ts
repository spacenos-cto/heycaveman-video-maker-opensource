import { describe, expect, it } from 'vitest';
import { direct } from '../../src/director';
import { makeCaption, MAX_CAPTION_WORDS, prettifyFormula } from '../../src/director/caption';
import { clean, isTopicOnly } from '../../src/director/clean';
import { splitSentences } from '../../src/director/split';
import { EXAMPLE_LESSON } from '../../src/data/examples';

const OPTS = { shape: 'wide' as const, mood: 'bright' as const, readingSpeed: 'normal' as const };
const plan = (text: string) => direct(text, OPTS).scenes;

describe('the offline director (prd.md > F6)', () => {
  it('makes the same video from the same text', () => {
    expect(plan(EXAMPLE_LESSON)).toEqual(plan(EXAMPLE_LESSON));
  });

  it('a different seed (Shuffle) keeps the words but may change acting', () => {
    const a = direct(EXAMPLE_LESSON, OPTS).scenes;
    const b = direct(EXAMPLE_LESSON, { ...OPTS, seed: 42 }).scenes;
    expect(b.map((s) => s.words)).toEqual(a.map((s) => s.words));
  });

  it('blank lines force a new scene', () => {
    const scenes = plan('Plants need sunlight to make their food.\n\nAnimals eat plants to get their energy.');
    expect(scenes).toHaveLength(2);
  });

  it('joins very short sentences to a neighbour', () => {
    const scenes = plan('Plants are amazing living things that feed the whole world. Really.');
    expect(scenes).toHaveLength(1);
  });

  it('splits very long sentences', () => {
    const long =
      'The water cycle moves water around our planet all the time, from oceans and lakes into the sky as vapour and then back down to the ground as rain or snow that fills rivers again.';
    expect(plan(long).length).toBeGreaterThan(1);
  });

  it('a question makes him think', () => {
    expect(plan('Have you ever wondered how a plant eats without a mouth?')[0].motion).toBe('think');
  });

  it('"yay" makes him celebrate, and "but" makes him disagree', () => {
    expect(plan('Yay, the plant finally made its own food today!')[0].motion).toBe('celebrate');
    expect(plan('Many people say plants eat soil, but that is not how it works.')[0].motion).toBe('disagree');
  });

  it('steps and numbers make him explain', () => {
    expect(plan('First, the leaves catch the bright sunlight.')[0].motion).toBe('explain');
  });

  it('neighbouring scenes without cue words vary their motion', () => {
    const scenes = plan('Leaves are green and wide and flat.\n\nRoots hold the soil firmly in place.\n\nStems carry water up to the top.');
    for (let i = 1; i < scenes.length; i++) expect(scenes[i].motion).not.toBe(scenes[i - 1].motion);
  });

  it('matches drawings to words, and leaves unmatched scenes caption-led', () => {
    const plant = plan('The leaves of a plant catch sunlight.')[0];
    expect(plant.props.map((p) => p.assetId)).toContain('plant');
    const none = plan('Zorblax quintessentially vexed the gnomish ombudsman.')[0];
    expect(none.props).toHaveLength(0);
    expect(none.captions[0].text.length).toBeGreaterThan(0);
  });

  it('keeps a setting until the story moves somewhere new', () => {
    const scenes = plan('We start in the kitchen with a pot of rice.\n\nThe rice needs water to cook properly.\n\nThen we walk to the park for a picnic.');
    expect(scenes[0].background).toEqual({ type: 'setting', assetId: 'bg-kitchen' });
    expect(scenes[1].background).toEqual({ type: 'setting', assetId: 'bg-kitchen' });
    expect(scenes[2].background).toEqual({ type: 'setting', assetId: 'bg-park' });
  });

  it('never repeats a background colour in neighbouring scenes', () => {
    const scenes = plan('Alpha bravo charlie delta echo.\n\nFoxtrot golf hotel india juliet.\n\nKilo lima mike november oscar.\n\nPapa quebec romeo sierra tango.');
    for (let i = 1; i < scenes.length; i++) {
      const a = scenes[i - 1].background;
      const b = scenes[i].background;
      if (a.type === 'color' && b.type === 'color') expect(b.color).not.toBe(a.color);
    }
  });

  it('captions are short key words, never paragraphs', () => {
    for (const s of plan(EXAMPLE_LESSON)) {
      expect(s.captions[0].text.split(/\s+/).length).toBeLessThanOrEqual(MAX_CAPTION_WORDS);
    }
    expect(makeCaption('Leaves catch the bright sunlight every single morning.').text).not.toMatch(/\bthe\b/);
  });

  it('turns equations into word-art', () => {
    expect(prettifyFormula('CO2 + H2O -> food')).toBe('CO₂ + H₂O → food');
    const c = makeCaption('Remember: CO2 + H2O -> food for the plant.');
    expect(c.wordArt).toBe(true);
  });

  it('scenes last at least 2.5 s and longer text lasts longer', () => {
    const [short, long] = plan('Leaves are green and catch light.\n\nThe roots pull water and minerals up from deep in the soil so the whole plant can keep growing taller every day.');
    expect(short.durationMs).toBeGreaterThanOrEqual(2500);
    expect(long.durationMs).toBeGreaterThan(short.durationMs);
  });
});

describe('lesson input rules (prd.md > F2, F3.4)', () => {
  it('spots a topic with no sentence', () => {
    expect(isTopicOnly('volcanoes')).toBe(true);
    expect(isTopicOnly('the water cycle')).toBe(true);
    expect(isTopicOnly('Volcanoes erupt when pressure builds.')).toBe(false);
  });

  it('cleans bullets, emojis and links', () => {
    const c = clean('- Leaves catch light 🌞\n- Roots drink water\nSee https://example.com/x for more.');
    expect(c.text).toContain('Leaves catch light.');
    expect(c.text).toContain('Roots drink water.');
    expect(c.text).not.toMatch(/https?:/);
    expect(c.removedLinks).toBe(1);
  });

  it('does not split on decimals or abbreviations', () => {
    expect(splitSentences('Pi is about 3.14 in value. Dr. Rao agrees with that.')).toEqual([
      'Pi is about 3.14 in value.',
      'Dr. Rao agrees with that.',
    ]);
  });
});

describe('variety (prd.md > F6)', () => {
  it('does not repeat a drawing in the next scene when another one matches', () => {
    const scenes = plan('After lunch we feel full of food.\n\nFood gives us energy to drink water and play.');
    const first = scenes[0].props.map((p) => p.assetId);
    const second = scenes[1].props.map((p) => p.assetId);
    expect(second.some((id) => first.includes(id))).toBe(false);
  });

  it('still repeats a drawing when it is the only match (story continuity)', () => {
    const scenes = plan('The plant needs sunlight every single day.\n\nThe plant also needs a little bit of soil.');
    expect(scenes[1].props.map((p) => p.assetId)).toContain('plant');
  });
});
