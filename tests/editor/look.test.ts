import { describe, expect, it } from 'vitest';
import { CAVEY } from '../../src/caveman/presets';
import { newProject } from '../../src/director';
import { switchMood, switchShape } from '../../src/editor/sceneOps';
import type { Mood } from '../../src/types';
import { contrast } from '../../src/video/contrast';
import { MOODS } from '../../src/video/moods';

const LESSON = 'Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nWater goes up the stem.\n\nThe plant breathes through its leaves.\n\nRemember: plants make their own food!';
const make = (mood: Mood) => newProject(LESSON, { shape: 'wide', mood, caveman: CAVEY, readingSpeed: 'normal' });

describe('colour moods and shapes (prd.md > Look and Feel, F5)', () => {
  it('every mood keeps caption text at 7:1 or better against its outline or band', () => {
    for (const [name, m] of Object.entries(MOODS)) {
      const against = m.band ? '#FFFFFF' : m.captionStroke;
      expect(contrast(m.captionFill, against), name).toBeGreaterThanOrEqual(7);
      // The key word must stay readable too (large bold text: 4.5:1).
      expect(contrast(m.highlight, against), `${name} highlight`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('no two neighbouring scenes share a background colour, in every mood and after a switch', () => {
    for (const mood of ['bright', 'earthy', 'soft'] as Mood[]) {
      const p = make(mood);
      for (const to of ['bright', 'earthy', 'soft'] as Mood[]) {
        const scenes = switchMood(p, to).scenes;
        for (let i = 1; i < scenes.length; i++) {
          const a = scenes[i - 1].background;
          const b = scenes[i].background;
          if (a.type === 'color' && b.type === 'color') expect(a.color, `${mood}→${to} scene ${i}`).not.toBe(b.color);
        }
      }
    }
  });

  it('a mood switch changes only background colours (and the mood)', () => {
    const p = make('bright');
    const q = switchMood(p, 'earthy');
    expect(q.mood).toBe('earthy');
    q.scenes.forEach((s, i) => {
      const { background: b1, ...rest1 } = s;
      const { background: b0, ...rest0 } = p.scenes[i];
      expect(rest1).toEqual(rest0);
      if (b0.type === 'color') expect(MOODS.earthy.backgrounds).toContain(b1.type === 'color' ? b1.color : '');
      else expect(b1).toEqual(b0);
    });
    expect(q.caveman).toEqual(p.caveman);
  });

  it('a shape switch moves director-placed drawings to the new spots and keeps text, captions and voice', () => {
    const p = make('bright');
    const tall = switchShape(p, 'tall');
    tall.scenes.forEach((s, i) => {
      expect(s.words).toBe(p.scenes[i].words);
      expect(s.captions).toEqual(p.scenes[i].captions);
      expect(s.voice).toEqual(p.scenes[i].voice);
      for (const prop of s.props) expect(prop.x).toBeGreaterThanOrEqual(20); // phone-safe margin
    });
    expect(switchShape(tall, 'wide').scenes).toEqual(p.scenes);
  });
});
