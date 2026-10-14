import { describe, expect, it } from 'vitest';
import { CAVEY } from '../../src/caveman/presets';
import { newProject } from '../../src/director';
import { searchAssets } from '../../src/editor/Library';
import { addCaption, addProp, blankProject, clampProp, editCaptionAt, reorderScene, setDuration, setProp, switchShape } from '../../src/editor/sceneOps';
import { uploadIds, uploadRef } from '../../src/editor/uploads';
import { packProject, unpackProject } from '../../src/storage/projectFile';
import type { Project, Shape } from '../../src/types';
import { captionVisible, propVisible } from '../../src/video/SceneSvg';
import { SIZES } from '../../src/video/timeline';

const base = () =>
  newProject('Leaves catch the bright sunlight.\n\nRoots drink water from the soil.\n\nRemember: plants make their own food!', { shape: 'wide', mood: 'bright', caveman: CAVEY, readingSpeed: 'normal' });

/** The prop's box in frame pixels. */
function inside(p: { x: number; y: number; scale: number }, shape: Shape) {
  const { width, height } = SIZES[shape];
  const half = ((p.scale / 100) * height) / 2;
  const cx = (p.x / 100) * width;
  const cy = (p.y / 100) * height;
  return cx - half >= -0.5 && cx + half <= width + 0.5 && cy - half >= -0.5 && cy + half <= height + 0.5;
}

describe('the Editor (prd.md > F9)', () => {
  it('placement percentages survive a shape switch and stay inside the frame', () => {
    let p = base();
    p = { ...p, scenes: p.scenes.map((s) => ({ ...s, props: [] })) };
    p = addProp(p, 0, 'plant');
    // Dragged into the far right corner and made big on the wide frame.
    p = setProp(p, 0, 0, clampProp({ ...p.scenes[0].props[0], x: 99, y: 99, scale: 60 }, 'wide'));
    expect(inside(p.scenes[0].props[0], 'wide')).toBe(true);
    for (const shape of ['tall', 'square', 'wide'] as Shape[]) {
      p = switchShape(p, shape);
      for (const s of p.scenes) for (const prop of s.props) expect(inside(prop, shape)).toBe(true);
    }
    // Something already inside isn't moved by a switch.
    const centred = setProp(base(), 0, 0, { x: 50, y: 50, scale: 20 });
    expect(switchShape(centred, 'tall').scenes[0].props[0]).toMatchObject({ x: 50, y: 50, scale: 20 });
  });

  it('a .caveman file with uploaded pictures round-trips', () => {
    let p = base();
    const ref = uploadRef('img:p1:abc');
    p = addProp(p, 0, ref);
    p = { ...p, scenes: p.scenes.map((s, i) => (i === 1 ? { ...s, background: { type: 'upload' as const, blobId: 'img:p1:bg' } } : s)) };
    expect(uploadIds(p).sort()).toEqual(['img:p1:abc', 'img:p1:bg']);
    const images = { 'img:p1:abc': new Uint8Array([1, 2, 3]), 'img:p1:bg': new Uint8Array([4, 5]) };
    const back = unpackProject(packProject(p, {}, images));
    expect(back.project.scenes[0].props.at(-1)?.assetId).toBe(ref);
    expect(back.project.scenes[1].background).toEqual({ type: 'upload', blobId: 'img:p1:bg' });
    expect([...back.images['img:p1:abc']]).toEqual([1, 2, 3]);
    expect([...back.images['img:p1:bg']]).toEqual([4, 5]);
  });

  it('keeps voice settings when a file is opened again', () => {
    const p: Project = { ...base(), voiceId: 'af_heart', voiceSpeed: 'slow', edited: true };
    const back = unpackProject(packProject(p)).project;
    expect(back).toMatchObject({ voiceId: 'af_heart', voiceSpeed: 'slow', edited: true });
    expect(back.extra).toBeUndefined();
  });

  it('reorders by drag, sets lengths within limits, and times props and captions', () => {
    const p = base();
    const moved = reorderScene(p, 0, 2);
    expect(moved.scenes.map((s) => s.id)).toEqual([p.scenes[1].id, p.scenes[2].id, p.scenes[0].id]);
    expect(setDuration(p, 0, 100).scenes[0].durationMs).toBe(1000);
    expect(setDuration(p, 0, 99_000).scenes[0].durationMs).toBe(30_000);
    expect(propVisible({ inMs: 1000, outMs: 2000 }, 15)).toBe(false); // 0.5 s
    expect(propVisible({ inMs: 1000, outMs: 2000 }, 45)).toBe(true); // 1.5 s
    expect(propVisible({ inMs: 1000, outMs: 2000 }, 75)).toBe(false); // 2.5 s
    const two = addCaption(addCaption(base(), 0), 0);
    expect(two.scenes[0].captions).toHaveLength(3);
    const timed = editCaptionAt(two, 0, 2, { startMs: 1000, endMs: 2000 });
    expect(captionVisible(timed.scenes[0].captions[2], 30)).toBe(true);
    expect(captionVisible(timed.scenes[0].captions[2], 90)).toBe(false);
  });

  it('starts a blank video with one scene, and the library finds drawings by name and group', () => {
    const blank = blankProject(base());
    expect(blank.scenes).toHaveLength(1);
    expect(blank.scenes[0].words).toBe('');
    expect(searchAssets('plant', null).map((a) => a.id)).toContain('plant');
    expect(searchAssets('', 'food').every((a) => a.category === 'food')).toBe(true);
    expect(searchAssets('science', null).length).toBeGreaterThan(0);
  });
});
