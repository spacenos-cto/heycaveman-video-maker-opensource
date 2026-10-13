// Give a video its voice: speak each scene with the built-in voice, or keep a recording, then re-time the
// scene to the voice so it lasts as long as the words take (devpost/prd.md > F10, F6 Timing).
import { sceneDuration } from '../director/timing';
import { storage } from '../storage/db';
import type { Project, Scene } from '../types';
import { encodeWav, loudnessEnvelope } from './envelope';
import { speak } from './voiceClient';

export const SPEEDS = { slow: 0.85, normal: 1, fast: 1.15 } as const;

/** A scene needs a voice if it has words (title cards and end cards are silent or captioned). */
export const speakable = (s: Scene) => s.kind !== 'end' && s.words.trim().length > 0;

const blobId = (projectId: string, sceneId: string, kind: string) => `${projectId}:${sceneId}:${kind}:${Date.now().toString(36)}`;

async function keepClip(project: Project, scene: Scene, samples: Float32Array, sampleRate: number, type: 'builtin' | 'recorded', voiceId?: string): Promise<Scene> {
  const id = blobId(project.id, scene.id, type);
  await (await storage()).putBlob(id, encodeWav(samples, sampleRate));
  const durationMs = Math.round((samples.length / sampleRate) * 1000);
  return {
    ...scene,
    voice: { type, blobId: id, envelope: loudnessEnvelope(samples, sampleRate), stale: false, voiceId, durationMs },
    durationMs: sceneDuration(scene.words, project.readingSpeed, durationMs),
  };
}

/** Voice every scene with a built-in voice. Recorded scenes keep their recordings (mixed voices). */
export async function voiceProject(
  project: Project,
  voiceId: string,
  speed: keyof typeof SPEEDS,
  onScene?: (done: number, total: number) => void,
  shouldStop?: () => boolean,
): Promise<Project> {
  const scenes = [...project.scenes];
  const todo = scenes.map((s, i) => ({ s, i })).filter(({ s }) => speakable(s) && s.voice.type !== 'recorded');
  let done = 0;
  for (const { s, i } of todo) {
    if (shouldStop?.()) break;
    const { samples, sampleRate } = await speak(s.words, voiceId, SPEEDS[speed]);
    scenes[i] = await keepClip(project, s, samples, sampleRate, 'builtin', voiceId);
    onScene?.(++done, todo.length);
  }
  return { ...project, scenes, voiceMode: 'builtin', voiceId, voiceSpeed: speed, updatedAt: Date.now() };
}

/** Keep one scene's recording (already checked for silence). */
export async function keepRecording(project: Project, sceneIndex: number, samples: Float32Array, sampleRate: number): Promise<Project> {
  const scenes = [...project.scenes];
  scenes[sceneIndex] = await keepClip(project, scenes[sceneIndex], samples, sampleRate, 'recorded');
  return { ...project, scenes, voiceMode: project.voiceMode === 'none' ? 'recorded' : project.voiceMode, updatedAt: Date.now() };
}

/** "No voice": captions and sound effects only; scenes go back to reading time. */
export function removeVoices(project: Project): Project {
  return {
    ...project,
    voiceMode: 'none',
    scenes: project.scenes.map((s) => ({ ...s, voice: { type: 'none' }, durationMs: sceneDuration(s.words, project.readingSpeed) })),
    updatedAt: Date.now(),
  };
}

export const staleScenes = (p: Project) => p.scenes.filter((s) => s.voice.stale);
