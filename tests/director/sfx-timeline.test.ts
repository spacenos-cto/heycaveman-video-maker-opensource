import { describe, expect, it } from 'vitest';
import { newProject } from '../../src/director';
import { chooseSfx, sfxGain } from '../../src/director/sfx';
import { CAVEY } from '../../src/caveman/presets';
import { FPS, locate, timeline } from '../../src/video/timeline';
import { spring } from '../../src/video/spring';

const base = { shape: 'wide' as const, mood: 'bright' as const, caveman: CAVEY, readingSpeed: 'normal' as const };

describe('sound effects (prd.md > F11)', () => {
  it('a key fact gets a ding, a drawing gets a pop, a plain scene change gets a whoosh', () => {
    expect(chooseSfx({ words: 'Remember: water matters.', props: [] }, 3)).toBe('ding');
    expect(chooseSfx({ words: 'A plant.', props: [{ assetId: 'plant', x: 0, y: 0, scale: 10, rotation: 0 }] }, 3)).toBe('pop');
    expect(chooseSfx({ words: 'Nothing here.', props: [] }, 3)).toBe('whoosh');
    expect(chooseSfx({ words: 'Nothing here.', props: [] }, 0)).toBeUndefined();
  });

  it('Gentle is quieter than On, and Off is silent', () => {
    expect(sfxGain('gentle')).toBeLessThan(sfxGain('on'));
    expect(sfxGain('off')).toBe(0);
  });
});

describe('timeline (player and export agree)', () => {
  it('adds a 3 s end card only when it is switched on', () => {
    const p = newProject('Leaves catch the bright sunlight every day.', base);
    const withCard = timeline(p);
    const without = timeline({ ...p, endCard: false });
    expect(withCard.total - without.total).toBe(3 * FPS);
    expect(withCard.scenes.at(-1)?.kind).toBe('end');
  });

  it('locates every frame in exactly one scene', () => {
    const tl = timeline(newProject('One two three four five.\n\nSix seven eight nine ten.', base));
    expect(locate(tl, 0)).toEqual({ index: 0, local: 0 });
    expect(locate(tl, tl.starts[1])).toEqual({ index: 1, local: 0 });
    expect(locate(tl, tl.total + 50).index).toBe(tl.scenes.length - 1);
  });

  it('springs are pure functions of the frame (same frame, same picture)', () => {
    expect(spring(10)).toBe(spring(10));
    expect(spring(0)).toBe(0);
    expect(spring(120)).toBeCloseTo(1, 2);
  });
});
