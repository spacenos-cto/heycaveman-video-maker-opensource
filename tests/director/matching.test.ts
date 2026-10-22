import { describe, expect, it } from 'vitest';
import { direct } from '../../src/director';
import { newLessonProject, TEMPLATES } from '../../src/director/lesson';
import { EXAMPLE_LESSON } from '../../src/data/examples';
import { CAVEY } from '../../src/caveman/presets';
import { matchName } from '../../src/director/words';

// Which drawings each sentence gets (finish-to-submit PRD MATCH-2). One entry per scene, in order;
// "a+b" = two drawings, "" = none. A change here should be a deliberate improvement, checked by eye.
const OPTS = { shape: 'wide' as const, mood: 'bright' as const, readingSpeed: 'normal' as const };
const PLANT = 'Leaves catch the bright sunlight every day.\n\nRoots drink water from the soil below.\n\nRemember: plants make their own food!';

const drawings = (scenes: { props: { assetId: string }[] }[]) => scenes.map((s) => s.props.map((p) => p.assetId).join('+'));

const EXPECTED_TEMPLATES: Record<string, string[]> = {
  concept: ['plant', 'plant', 'leaf+sun', 'plant+water-drop', 'leaf', 'plant', '', '', 'plant'],
  history: ['moon', 'moon', 'rocket', '', 'moon', 'magnifying-glass+globe', '', '', 'moon'],
  process: ['', 'water-drop', 'water-drop', 'water-drop', 'water-drop', 'burger', '', '', 'water-drop'],
  word: ['', 'speech-bubble', 'burger', 'burger', 'pizza', '', '', 'pizza'],
  myth: ['book', 'book', 'book', 'book', 'bed', '', '', 'book'],
  book: ['', 'trophy', 'trophy', 'bed', 'trophy', 'trophy', '', '', 'trophy'],
};

describe('words → drawings (PRD MATCH)', () => {
  it('the plant lesson shows what each sentence is about', () => {
    expect(drawings(direct(PLANT, OPTS).scenes)).toEqual(['leaf+sun', 'plant+water-drop', 'plant']);
  });

  it('the Try-an-example lesson', () => {
    expect(drawings(direct(EXAMPLE_LESSON, OPTS).scenes)).toEqual(['bed', 'burger', 'heart', 'burger', 'heart', 'clock', 'bed', '', 'water-drop', 'exclamation-mark']);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))('template %s with its grey example', (id, t) => {
    expect(drawings(newLessonProject(t.example, { ...OPTS, caveman: CAVEY }).scenes)).toEqual(EXPECTED_TEMPLATES[id]);
  });

  it('weak hints never sit beside a named thing', () => {
    // "day" (calendar) and "bright" (light bulb) lose to leaves and sunlight.
    expect(drawings(direct('Leaves catch the bright sunlight every day.', OPTS).scenes)).toEqual(['leaf+sun']);
    // A weak hint alone still brings one drawing.
    expect(drawings(direct('We had a big lunch today.', OPTS).scenes)).toEqual(['burger']);
  });

  it('plurals and short endings count; long look-alikes do not', () => {
    const words = (s: string) => s.split(' ');
    expect(matchName('plant*', words('plants grow'), 'plants grow').strength).toBe(2);
    expect(matchName('sleep*', words('so sleepy'), 'so sleepy').strength).toBe(2);
    expect(matchName('win*', words('open the window'), 'open the window').strength).toBe(0);
  });

  it('the same text still makes the same drawings', () => {
    expect(drawings(direct(PLANT, OPTS).scenes)).toEqual(drawings(direct(PLANT, OPTS).scenes));
  });
});
