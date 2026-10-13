// The 16 motions (devpost/prd.md > Scope: Acting). Each is a looping list of keyframe poses;
// the rig eases between them. Only the joints that differ from REST are listed.
import type { MotionId } from '../types';
import { REST, type Pose } from './skeleton';

type Key = Partial<Pose>;
type Motion = { cycle: number; keys: Key[] }; // cycle in frames at 30 fps; keys spread evenly, looping

const M: Record<MotionId, Motion> = {
  idle: { cycle: 60, keys: [{ y: 0 }, { y: -2, head: 2 }] },
  talk: {
    cycle: 36,
    keys: [
      { rUpper: 38, rLower: 70, head: -3 },
      { rUpper: 52, rLower: 50, head: 3 },
    ],
  },
  explain: {
    cycle: 40,
    keys: [
      { lUpper: -34, lLower: -95, rUpper: 34, rLower: 95 },
      { lUpper: -44, lLower: -80, rUpper: 44, rLower: 80, head: 3 },
    ],
  },
  point: {
    cycle: 50,
    keys: [
      { rUpper: 112, rLower: -4, torso: 3, head: 4 },
      { rUpper: 118, rLower: 0, torso: 3, head: 6 },
    ],
  },
  shrug: {
    cycle: 44,
    keys: [
      { lUpper: -46, lLower: -112, rUpper: 46, rLower: 112, head: 8, y: -3 },
      { lUpper: -40, lLower: -100, rUpper: 40, rLower: 100, head: 4, y: 0 },
    ],
  },
  wave: {
    cycle: 24,
    keys: [
      { rUpper: 150, rLower: 25, head: 4 },
      { rUpper: 150, rLower: -25, head: 4 },
    ],
  },
  think: {
    cycle: 70,
    keys: [
      { rUpper: 70, rLower: 140, lUpper: 12, lLower: 95, head: -7 },
      { rUpper: 72, rLower: 136, lUpper: 12, lLower: 95, head: -10, y: -1 },
    ],
  },
  celebrate: {
    cycle: 22,
    keys: [
      { lUpper: -158, lLower: -12, rUpper: 158, rLower: 12, y: 0, lShin: 20, rShin: -20 },
      { lUpper: -168, lLower: 12, rUpper: 168, rLower: -12, y: -16, lShin: 0, rShin: 0 },
    ],
  },
  facepalm: {
    cycle: 60,
    keys: [
      { rUpper: 95, rLower: 130, head: 14, torso: 4 },
      { rUpper: 98, rLower: 126, head: 18, torso: 6 },
    ],
  },
  crossArms: {
    cycle: 70,
    keys: [
      { lUpper: -18, lLower: 108, rUpper: 18, rLower: -108, head: -4 },
      { lUpper: -18, lLower: 108, rUpper: 18, rLower: -108, head: -6, y: -1 },
    ],
  },
  eat: {
    cycle: 30,
    keys: [
      { rUpper: 80, rLower: 135, head: 2 },
      { rUpper: 70, rLower: 100, head: -2 },
    ],
  },
  walk: {
    cycle: 28,
    keys: [
      { lThigh: -24, lShin: 8, rThigh: 22, rShin: 18, lUpper: 22, rUpper: -20, y: 0 },
      { lThigh: 0, lShin: 20, rThigh: 0, rShin: 0, lUpper: 0, rUpper: 0, y: -4 },
      { lThigh: 22, lShin: 18, rThigh: -24, rShin: 8, lUpper: -20, rUpper: 22, y: 0 },
      { lThigh: 0, lShin: 0, rThigh: 0, rShin: 20, lUpper: 0, rUpper: 0, y: -4 },
    ],
  },
  run: {
    cycle: 16,
    keys: [
      { lThigh: -40, lShin: 30, rThigh: 34, rShin: 40, lUpper: 40, lLower: 80, rUpper: -40, rLower: -80, torso: 10, y: 0 },
      { lThigh: 34, lShin: 40, rThigh: -40, rShin: 30, lUpper: -40, lLower: -80, rUpper: 40, rLower: 80, torso: 10, y: -8 },
    ],
  },
  scared: {
    cycle: 8,
    keys: [
      { lUpper: -58, lLower: -118, rUpper: 58, rLower: 118, lShin: 18, rShin: -18, x: -2, head: -4 },
      { lUpper: -58, lLower: -118, rUpper: 58, rLower: 118, lShin: 18, rShin: -18, x: 2, head: -4 },
    ],
  },
  slump: {
    cycle: 80,
    keys: [
      { torso: 9, head: 22, lUpper: -6, rUpper: 6, y: 5 },
      { torso: 11, head: 25, lUpper: -5, rUpper: 5, y: 6 },
    ],
  },
  disagree: {
    cycle: 18,
    keys: [
      { rUpper: 70, rLower: 92, head: -8 },
      { rUpper: 82, rLower: 78, head: 8 },
    ],
  },
};

const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/** The pose at a given frame of a motion (loops forever). */
export function poseAt(motion: MotionId, frame: number): Pose {
  const m = M[motion] ?? M.idle;
  const keys = m.keys.map((k) => ({ ...REST, ...k }));
  if (keys.length === 1) return keys[0];
  const t = (((frame % m.cycle) + m.cycle) % m.cycle) / m.cycle; // 0..1
  const pos = t * keys.length;
  const i = Math.floor(pos) % keys.length;
  const a = keys[i];
  const b = keys[(i + 1) % keys.length];
  const f = ease(pos - Math.floor(pos));
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = a[k] + (b[k] - a[k]) * f;
  return out;
}

export const MOTION_LABELS: Record<MotionId, string> = {
  idle: 'Stand', talk: 'Talk', shrug: 'Shrug', point: 'Point', eat: 'Eat', walk: 'Walk', wave: 'Wave',
  think: 'Think', celebrate: 'Celebrate', facepalm: 'Facepalm', crossArms: 'Cross arms', explain: 'Explain',
  run: 'Run', scared: 'Scared', slump: 'Slump', disagree: 'Disagree',
};
