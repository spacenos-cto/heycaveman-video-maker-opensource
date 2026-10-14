// Quick scene edits (devpost/prd.md > F8): pure functions that take a project and give back a changed
// copy, so the undo history can keep every step and the player redraws straight away.
import { PROP_SLOTS } from '../director/props';
import { MIN_SCENE_MS, sceneDuration } from '../director/timing';
import type { CavemanPlacement, Caption, PropPlacement, Project, Scene, Shape } from '../types';
import { MOODS } from '../video/moods';
import { SIZES } from '../video/timeline';

export const MAX_PROPS = 6;

export type SceneEditError = 'onlyScene';

const sceneId = () => `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

function withScenes(project: Project, scenes: Scene[]): Project {
  return { ...project, scenes, edited: true, updatedAt: Date.now() };
}

/**
 * Change one scene. New words mark its voice out of date (Update re-voices just that scene) and,
 * without a voice, re-time the scene to the new reading length.
 */
export function editScene(project: Project, index: number, patch: Partial<Omit<Scene, 'id'>>): Project {
  const scenes = [...project.scenes];
  const old = scenes[index];
  if (!old) return project;
  let next: Scene = { ...old, ...patch };
  if (patch.words !== undefined && patch.words !== old.words) {
    if (old.voice.type !== 'none') next = { ...next, voice: { ...old.voice, stale: true } };
    else next = { ...next, durationMs: sceneDuration(patch.words, project.readingSpeed) };
  }
  scenes[index] = next;
  return withScenes(project, scenes);
}

/** Change the scene's main caption. The highlighted key word stays only if it's still in the text. */
export function editCaption(project: Project, index: number, patch: Partial<Caption>): Project {
  const scene = project.scenes[index];
  if (!scene) return project;
  const current: Caption = scene.captions[0] ?? { text: '' };
  const next: Caption = { ...current, ...patch };
  if (patch.text !== undefined) {
    next.wordArt = false;
    if (next.keyword && !next.text.toLowerCase().includes(next.keyword.toLowerCase())) delete next.keyword;
  }
  const captions = next.text.trim() || next.style ? [next, ...scene.captions.slice(1)] : scene.captions.slice(1);
  return editScene(project, index, { captions });
}

export function duplicateScene(project: Project, index: number): Project {
  const scene = project.scenes[index];
  if (!scene) return project;
  const copy: Scene = { ...structuredClone(scene), id: sceneId() };
  const scenes = [...project.scenes];
  scenes.splice(index + 1, 0, copy);
  return withScenes(project, scenes);
}

export function deleteScene(project: Project, index: number): Project | SceneEditError {
  if (project.scenes.length <= 1) return 'onlyScene';
  return withScenes(project, project.scenes.filter((_, i) => i !== index));
}

/** Move a scene one place earlier (-1) or later (+1). */
export function moveScene(project: Project, index: number, by: -1 | 1): Project {
  const to = index + by;
  if (to < 0 || to >= project.scenes.length) return project;
  const scenes = [...project.scenes];
  [scenes[index], scenes[to]] = [scenes[to], scenes[index]];
  return withScenes(project, scenes);
}

/** A blank scene after this one: the caveman waits on a fresh mood colour for your words. */
export function addSceneAfter(project: Project, index: number): Project {
  const previous = project.scenes[index];
  const palette = MOODS[project.mood].backgrounds;
  const prevColor = previous?.background.type === 'color' ? previous.background.color : undefined;
  const color = palette.find((c) => c !== prevColor) ?? palette[0];
  const scene: Scene = {
    id: sceneId(),
    kind: 'line',
    words: '',
    captions: [],
    motion: 'explain',
    expression: 'happy',
    background: { type: 'color', color },
    props: [],
    durationMs: MIN_SCENE_MS,
    voice: { type: 'none' },
  };
  const scenes = [...project.scenes];
  scenes.splice(index + 1, 0, scene);
  return withScenes(project, scenes);
}

/** Add a drawing in the next free spot beside the caveman. */
export function addProp(project: Project, index: number, assetId: string): Project {
  const scene = project.scenes[index];
  if (!scene || scene.props.length >= MAX_PROPS) return project;
  const slots = PROP_SLOTS[project.shape];
  const n = scene.props.length;
  const slot = slots[n % slots.length];
  const nudge = Math.floor(n / slots.length) * 8; // later props step aside so none hides another
  const prop = { assetId, x: Math.max(8, slot.x - nudge), y: Math.min(80, slot.y + nudge / 2), scale: slot.scale, rotation: 0 };
  return editScene(project, index, { props: [...scene.props, prop] });
}

export function removeProp(project: Project, index: number, propIndex: number): Project {
  const scene = project.scenes[index];
  if (!scene) return project;
  return editScene(project, index, { props: scene.props.filter((_, i) => i !== propIndex) });
}

// ---- The Editor (devpost/prd.md > F9) ----

export const MIN_EDIT_MS = 1000;
export const MAX_EDIT_MS = 30_000;

/** Drag a scene from one place in the list to another. */
export function reorderScene(project: Project, from: number, to: number): Project {
  if (from === to || from < 0 || to < 0 || from >= project.scenes.length || to >= project.scenes.length) return project;
  const scenes = [...project.scenes];
  const [moved] = scenes.splice(from, 1);
  scenes.splice(to, 0, moved);
  return withScenes(project, scenes);
}

/** Scene length by hand; only without a voice (a voice sets its own length). */
export function setDuration(project: Project, index: number, ms: number): Project {
  const scene = project.scenes[index];
  if (!scene || scene.voice.type !== 'none') return project;
  return editScene(project, index, { durationMs: Math.round(Math.min(MAX_EDIT_MS, Math.max(MIN_EDIT_MS, ms))) });
}

export function setProp(project: Project, index: number, propIndex: number, patch: Partial<PropPlacement>): Project {
  const scene = project.scenes[index];
  if (!scene?.props[propIndex]) return project;
  const props = scene.props.map((p, i) => (i === propIndex ? { ...p, ...patch } : p));
  return editScene(project, index, { props });
}

export function setCavemanAt(project: Project, index: number, at: CavemanPlacement | undefined): Project {
  return editScene(project, index, { cavemanAt: at });
}

export function addCaption(project: Project, index: number, text = 'New caption'): Project {
  const scene = project.scenes[index];
  if (!scene) return project;
  const startMs = scene.captions.length ? Math.round(scene.durationMs / 2) : 0;
  return editScene(project, index, { captions: [...scene.captions, { text, startMs }] });
}

export function editCaptionAt(project: Project, index: number, captionIndex: number, patch: Partial<Caption>): Project {
  const scene = project.scenes[index];
  if (!scene?.captions[captionIndex]) return project;
  const captions = scene.captions.map((c, i) => {
    if (i !== captionIndex) return c;
    const next = { ...c, ...patch };
    if (patch.text !== undefined) next.wordArt = false;
    return next;
  });
  return editScene(project, index, { captions });
}

export function removeCaption(project: Project, index: number, captionIndex: number): Project {
  const scene = project.scenes[index];
  if (!scene) return project;
  return editScene(project, index, { captions: scene.captions.filter((_, i) => i !== captionIndex) });
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keep a drawing fully inside a frame of this shape (its size is a % of frame height). */
export function clampProp(p: PropPlacement, shape: Shape): PropPlacement {
  const { width, height } = SIZES[shape];
  const scale = clamp(p.scale, 4, Math.min(100, (width / height) * 100)); // never wider than the frame
  const halfW = ((scale / 100) * height * 0.5 * 100) / width; // half its width, as % of frame width
  const halfH = scale / 2;
  return { ...p, scale, x: clamp(p.x, Math.min(50, halfW), Math.max(50, 100 - halfW)), y: clamp(p.y, Math.min(50, halfH), Math.max(50, 100 - halfH)) };
}

export function clampCaveman(at: CavemanPlacement): CavemanPlacement {
  return { ...at, scale: clamp(at.scale, 15, 95), x: clamp(at.x, 5, 95), y: clamp(at.y, at.scale * 0.5, 100) };
}

/** Switch the video's shape; every hand-placed item stays inside the new frame. */
export function switchShape(project: Project, shape: Shape): Project {
  return {
    ...project,
    shape,
    scenes: project.scenes.map((s) => ({ ...s, props: s.props.map((p) => clampProp(p, shape)), cavemanAt: s.cavemanAt && clampCaveman(s.cavemanAt) })),
    updatedAt: Date.now(),
  };
}

/** Add an uploaded picture as a drawing. */
export function addPicture(project: Project, index: number, ref: string): Project {
  return addProp(project, index, ref);
}

/** A video with one blank scene, for building by hand in the Editor (devpost/prd.md > F9 Acceptance). */
export function blankProject(made: Project): Project {
  const empty: Project = { ...made, title: 'My new video', scenes: [], sourceText: '' };
  return { ...addSceneAfter(empty, -1), edited: false };
}
