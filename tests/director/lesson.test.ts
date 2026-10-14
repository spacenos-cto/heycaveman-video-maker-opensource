import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CAVEY } from '../../src/caveman/presets';
import { newProject } from '../../src/director';
import { autoHook, buildScript, lessonProblems, newLessonProject, outroLine, quizRevealMs, TEMPLATES } from '../../src/director/lesson';
import { shuffle } from '../../src/director/shuffle';
import type { Project } from '../../src/types';
import { SceneSvg } from '../../src/video/SceneSvg';
import { FPS, timeline } from '../../src/video/timeline';

const BASE = { shape: 'wide' as const, mood: 'bright' as const, caveman: CAVEY, readingSpeed: 'normal' as const };
const seconds = (p: Project) => timeline({ ...p, endCard: false }).total / FPS;

describe('Lesson Builder and templates (prd.md > F3.2, F3.3, F12)', () => {
  for (const tpl of TEMPLATES) {
    it(`"${tpl.title}" grey example → title, hook, points, example, recap, quiz, outro; 30–90 s`, () => {
      const l = tpl.example;
      const script = buildScript(l).split('\n\n');
      expect(script[0]).toBe(l.hook);
      expect(script.slice(1, 1 + l.points.length)).toEqual(l.points);
      expect(script.at(-1)).toBe(outroLine(l.topic));
      const p = newLessonProject(l, BASE);
      const kinds = p.scenes.map((s) => s.kind);
      expect(kinds[0]).toBe('title');
      expect(kinds.at(-3)).toBe('recap');
      expect(kinds.at(-2)).toBe('quiz');
      expect(kinds.at(-1)).toBe('line');
      expect(p.scenes[1].words).toBe(l.hook);
      const s = seconds(p);
      expect(s, `${tpl.id}: ${s.toFixed(1)} s`).toBeGreaterThanOrEqual(30);
      expect(s).toBeLessThanOrEqual(90);
    });
  }

  it('≥ 70% of spoken scenes across the 6 examples get a matching drawing or setting', () => {
    let lines = 0;
    let matched = 0;
    for (const tpl of TEMPLATES) {
      for (const s of newLessonProject(tpl.example, BASE).scenes.filter((x) => x.kind === 'line')) {
        lines++;
        if (s.props.length || s.background.type === 'setting') matched++;
      }
    }
    expect(matched / lines).toBeGreaterThanOrEqual(0.7);
  });

  it('makes a hook from the topic, and needs a topic and a point before Make', () => {
    expect(autoHook('volcanoes')).toBe('Ever wondered about volcanoes?');
    expect(buildScript({ topic: 'volcanoes', points: ['Lava is melted rock.'] }).split('\n\n')[0]).toBe('Ever wondered about volcanoes?');
    expect(lessonProblems({ topic: '', points: [''] })).toEqual(['topic', 'points']);
    expect(lessonProblems({ topic: 'Volcanoes', points: [''] })).toEqual(['points']);
    expect(lessonProblems({ topic: 'V', points: ['p'], quiz: { question: 'Which?', options: ['a', 'b'] } })).toEqual(['correct']);
    expect(lessonProblems({ topic: 'V', points: ['p'], quiz: { question: 'Which?', options: ['a', 'b'], correct: 1 } })).toEqual([]);
  });

  it('a quiz with no answer reveals "Discuss!", and multiple choice highlights the right one', () => {
    const render = (p: Project) => {
      const i = p.scenes.findIndex((s) => s.kind === 'quiz');
      const scene = p.scenes[i];
      const frame = Math.ceil((quizRevealMs(scene) / 1000) * FPS) + 20;
      return renderToStaticMarkup(createElement(SceneSvg, { project: p, scene, frame, index: i }));
    };
    const open = newLessonProject({ topic: 'Rain', points: ['Clouds are made of water drops.'], quiz: { question: 'Where does rain come from?' } }, BASE);
    expect(render(open)).toContain('Discuss!');
    const mc = newLessonProject(TEMPLATES.find((t) => t.id === 'word')!.example, BASE);
    const html = render(mc);
    expect(html).toContain('data-correct="true"');
    expect(html).toContain('An apple');
  });

  it('Shuffle changes poses and drawings but never the words', () => {
    const p = newProject(TEMPLATES.map((t) => t.example.points.join(' ')).join('\n\n'), BASE);
    const q = shuffle(p, 12345);
    expect(q.scenes.map((s) => s.words)).toEqual(p.scenes.map((s) => s.words));
    expect(q.scenes.map((s) => s.captions)).toEqual(p.scenes.map((s) => s.captions));
    const changed = q.scenes.filter((s, i) => s.motion !== p.scenes[i].motion || JSON.stringify(s.props) !== JSON.stringify(p.scenes[i].props));
    expect(changed.length).toBeGreaterThan(0);
  });

  it('a pause point holds the scene 3 s longer only in the exported file', () => {
    const p = newProject('Leaves catch the bright sunlight.\n\nRoots drink water from the soil.', BASE);
    const paused = { ...p, scenes: p.scenes.map((s, i) => (i === 0 ? { ...s, pauseHere: true } : s)) };
    expect(timeline(paused).total).toBe(timeline(p).total);
    expect(timeline(paused, { exporting: true }).total - timeline(p).total).toBe(3 * FPS);
  });
});
