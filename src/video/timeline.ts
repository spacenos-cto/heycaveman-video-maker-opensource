// Frames, sizes and where each scene sits in time. Shared by the player and the MP4 exporter.
import type { Project, Scene, Shape } from '../types';

export const FPS = 30;
export const END_CARD_MS = 3000;

export const SIZES: Record<Shape, { width: number; height: number }> = {
  wide: { width: 1920, height: 1080 },
  tall: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

/** A pause point holds the scene 3 s longer in the exported file; the in-app player stops there instead (prd.md > F12.5). */
export const PAUSE_HOLD_MS = 3000;

export const sceneFrames = (scene: Scene, exporting = false) =>
  Math.max(1, Math.round(((scene.durationMs + (exporting && scene.pauseHere ? PAUSE_HOLD_MS : 0)) / 1000) * FPS));

/** The end card: last 3 s, "Made with HeyCaveman" (devpost/prd.md > F13). */
export function endCardScene(): Scene {
  return {
    id: 'end-card',
    kind: 'end',
    words: '',
    captions: [],
    motion: 'wave',
    expression: 'happy',
    background: { type: 'color', color: '#FBF6EC' },
    props: [],
    durationMs: END_CARD_MS,
    voice: { type: 'none' },
  };
}

/** The scenes that play, in order: the lesson, then the end card when it's switched on. */
export function playedScenes(project: Project): Scene[] {
  return project.endCard ? [...project.scenes, endCardScene()] : project.scenes;
}

export type Timeline = { scenes: Scene[]; starts: number[]; total: number };

export function timeline(project: Project, { exporting = false } = {}): Timeline {
  const scenes = playedScenes(project);
  const starts: number[] = [];
  let t = 0;
  for (const s of scenes) {
    starts.push(t);
    t += sceneFrames(s, exporting);
  }
  return { scenes, starts, total: Math.max(1, t) };
}

/** Which scene is showing at a frame, and how far into it. */
export function locate(tl: Timeline, frame: number): { index: number; local: number } {
  const f = Math.min(Math.max(0, Math.floor(frame)), tl.total - 1);
  let index = 0;
  for (let i = 0; i < tl.starts.length; i++) if (tl.starts[i] <= f) index = i;
  return { index, local: f - tl.starts[index] };
}
