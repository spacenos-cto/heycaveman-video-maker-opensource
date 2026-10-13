// The caveman's skeleton: named joints, bone lengths and a pose solver.
// Angles are degrees measured from "straight down": 0 = down, 90 = towards screen-right,
// -90 = towards screen-left, 180 = up. Lower bones (forearm, shin) are relative to their upper bone.

export type Pose = {
  torso: number; // lean of the spine
  head: number; // head tilt
  lUpper: number; lLower: number; // screen-left arm
  rUpper: number; rLower: number; // screen-right arm
  lThigh: number; lShin: number;
  rThigh: number; rShin: number;
  y: number; // body bounce, px (negative = up)
  x: number; // body shift, px
};

export const REST: Pose = {
  torso: 0, head: 0,
  lUpper: -16, lLower: 6, rUpper: 16, rLower: -6,
  lThigh: -9, lShin: 2, rThigh: 9, rShin: -2,
  y: 0, x: 0,
};

export const BONES = { spine: 72, neck: 10, upperArm: 42, forearm: 38, thigh: 52, shin: 50 } as const;
export const HIP = { x: 100, y: 205 }; // in the rig's 200 x 320 box; feet land near y = 307

export type Point = { x: number; y: number };

const rad = (deg: number) => (deg * Math.PI) / 180;
const step = (from: Point, angle: number, length: number): Point => ({
  x: from.x + Math.sin(rad(angle)) * length,
  y: from.y + Math.cos(rad(angle)) * length,
});

export type Solved = {
  hip: Point; neck: Point; shoulder: Point; headCenter: Point; headRadius: number;
  lElbow: Point; lHand: Point; rElbow: Point; rHand: Point;
  lKnee: Point; lFoot: Point; rKnee: Point; rFoot: Point;
};

/** Turn joint angles into joint positions. headSize scales the head (0.8 small .. 1.3 big). */
export function solve(pose: Pose, headSize = 1): Solved {
  const hip = { x: HIP.x + pose.x, y: HIP.y + pose.y };
  const spineAngle = 180 + pose.torso; // spine points up from the hip
  const neck = step(hip, spineAngle, BONES.spine);
  const shoulder = step(hip, spineAngle, BONES.spine - 6);
  const headRadius = 27 * headSize;
  const headCenter = step(neck, spineAngle + pose.head, BONES.neck + headRadius);
  const lElbow = step(shoulder, pose.lUpper + pose.torso, BONES.upperArm);
  const lHand = step(lElbow, pose.lUpper + pose.lLower + pose.torso, BONES.forearm);
  const rElbow = step(shoulder, pose.rUpper + pose.torso, BONES.upperArm);
  const rHand = step(rElbow, pose.rUpper + pose.rLower + pose.torso, BONES.forearm);
  const lKnee = step(hip, pose.lThigh, BONES.thigh);
  const lFoot = step(lKnee, pose.lThigh + pose.lShin, BONES.shin);
  const rKnee = step(hip, pose.rThigh, BONES.thigh);
  const rFoot = step(rKnee, pose.rThigh + pose.rShin, BONES.shin);
  return { hip, neck, shoulder, headCenter, headRadius, lElbow, lHand, rElbow, rHand, lKnee, lFoot, rKnee, rFoot };
}
