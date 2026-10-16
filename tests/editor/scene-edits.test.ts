import { describe, expect, it } from 'vitest';
import { newProject } from '../../src/director';
import { addProp, addSceneAfter, deleteScene, duplicateScene, editCaption, editScene, MAX_PROPS, moveScene, removeProp } from '../../src/editor/sceneOps';
import { emptyHistory, HISTORY_LIMIT, record, redo, undo } from '../../src/store/history';
import { CAVEY } from '../../src/caveman/presets';
import { MOTIONS, type Project } from '../../src/types';

const base = () =>
  newProject('Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nRemember: plants make their own food!', {
    shape: 'wide',
    mood: 'bright',
    caveman: CAVEY,
    readingSpeed: 'normal',
  });

describe('scene edits (prd.md > F8)', () => {
  it('50 edits then 50 undos gives back the original project, and 50 redos the last one', () => {
    const original = base();
    let project: Project = original;
    let h = emptyHistory();
    for (let i = 0; i < 50; i++) {
      const next = editScene(project, i % 3, { motion: MOTIONS[i % MOTIONS.length] });
      h = record(h, project, undefined, i * 2000);
      project = next;
    }
    const last = project;
    for (let i = 0; i < 50; i++) {
      const step = undo(h, project)!;
      expect(step).not.toBeNull();
      h = step.history;
      project = step.project;
    }
    expect(project).toEqual(original);
    expect(undo(h, project)).toBeNull();
    for (let i = 0; i < 50; i++) {
      const step = redo(h, project)!;
      h = step.history;
      project = step.project;
    }
    expect(project).toEqual(last);
  });

  it('keeps at least 50 steps and merges typing in one box into one step', () => {
    let h = emptyHistory();
    const p = base();
    for (let i = 0; i < 200; i++) h = record(h, p, undefined, i * 2000);
    expect(h.past.length).toBe(HISTORY_LIMIT);
    expect(HISTORY_LIMIT).toBeGreaterThanOrEqual(50);
    let typing = emptyHistory();
    typing = record(typing, p, 'words:s1', 0);
    typing = record(typing, p, 'words:s1', 300);
    typing = record(typing, p, 'words:s1', 600);
    expect(typing.past.length).toBe(1);
    typing = record(typing, p, 'words:s1', 3000);
    expect(typing.past.length).toBe(2);
  });

  it('blocks deleting the only scene', () => {
    const one = { ...base(), scenes: base().scenes.slice(0, 1) };
    expect(deleteScene(one, 0)).toBe('onlyScene');
    const two = deleteScene(base(), 1) as Project;
    expect(two.scenes).toHaveLength(2);
  });

  it('new words mark a voice out of date, or re-time a silent scene', () => {
    const p = base();
    const voiced = editScene(p, 0, { voice: { type: 'builtin', blobId: 'x', durationMs: 2000 } });
    expect(editScene(voiced, 0, { words: 'Something new' }).scenes[0].voice.stale).toBe(true);
    const long = editScene(p, 1, { words: 'word '.repeat(60) });
    expect(long.scenes[1].durationMs).toBeGreaterThan(p.scenes[1].durationMs);
    expect(long.edited).toBe(true);
  });

  it('duplicates, moves and adds scenes with fresh ids', () => {
    const p = base();
    const dup = duplicateScene(p, 0);
    expect(dup.scenes).toHaveLength(4);
    expect(dup.scenes[1].words).toBe(p.scenes[0].words);
    expect(dup.scenes[1].id).not.toBe(p.scenes[0].id);
    const moved = moveScene(p, 0, 1);
    expect(moved.scenes.map((s) => s.id)).toEqual([p.scenes[1].id, p.scenes[0].id, p.scenes[2].id]);
    expect(moveScene(p, 0, -1)).toBe(p);
    const added = addSceneAfter(p, 2);
    expect(added.scenes[3].words).toBe('');
    expect(new Set(added.scenes.map((s) => s.id)).size).toBe(4);
  });

  it('caption edits keep the key word only while it is still there, and styles stick', () => {
    const p = editCaption(base(), 0, { text: 'Leaves love light', keyword: 'Leaves' });
    expect(p.scenes[0].captions[0].keyword).toBe('Leaves');
    const q = editCaption(p, 0, { text: 'Sunlight' });
    expect(q.scenes[0].captions[0].keyword).toBeUndefined();
    expect(editCaption(q, 0, { style: 'red' }).scenes[0].captions[0].style).toBe('red');
  });

  it('adds drawings up to the limit, all inside the frame, and removes them', () => {
    let p = base();
    p = { ...p, scenes: p.scenes.map((s) => ({ ...s, props: [] })) };
    for (let i = 0; i < MAX_PROPS + 2; i++) p = addProp(p, 0, 'plant');
    expect(p.scenes[0].props).toHaveLength(MAX_PROPS);
    for (const prop of p.scenes[0].props) {
      expect(prop.x).toBeGreaterThan(0);
      expect(prop.x).toBeLessThan(100);
      expect(prop.y).toBeLessThan(100);
    }
    expect(removeProp(p, 0, 0).scenes[0].props).toHaveLength(MAX_PROPS - 1);
  });

  it('new words update the caption and drawings at once, until those are changed by hand', () => {
    const p = editScene(base(), 1, { words: 'A rocket flies to the moon.' });
    expect(p.scenes[1].captions[0].text).toMatch(/rocket/i);
    expect(p.scenes[1].props.map((x) => x.assetId)).toContain('moon');
    const byHand = editCaption(p, 1, { text: 'My own words' });
    const again = editScene(byHand, 1, { words: 'Pizza is my favourite food.' });
    expect(again.scenes[1].captions[0].text).toBe('My own words');
    expect(again.scenes[1].props.map((x) => x.assetId)).toContain('pizza');
    const propsByHand = removeProp(again, 1, 0);
    const third = editScene(propsByHand, 1, { words: 'A car drives home.' });
    expect(third.scenes[1].props).toEqual(propsByHand.scenes[1].props);
  });
});

