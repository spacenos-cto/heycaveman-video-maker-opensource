// Quick scene edits (devpost/prd.md > F8): pure functions that take a project and give back a changed
// copy, so the undo history can keep every step and the player redraws straight away.
import { PROP_SLOTS } from '../director/props';
import { MIN_SCENE_MS, sceneDuration } from '../director/timing';
import type { Caption, Project, Scene } from '../types';
import { MOODS } from '../video/moods';

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
