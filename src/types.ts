// The shapes of everything the app stores. See devpost/spec.md > Data Model.

export type Shape = 'wide' | 'tall' | 'square';
export type Mood = 'bright' | 'earthy' | 'soft';

export const MOTIONS = [
  'idle', 'talk', 'shrug', 'point', 'eat', 'walk', 'wave', 'think',
  'celebrate', 'facepalm', 'crossArms', 'explain', 'run', 'scared', 'slump', 'disagree',
] as const;
export type MotionId = (typeof MOTIONS)[number];

export const EXPRESSIONS = ['neutral', 'happy', 'surprised', 'worried', 'determined', 'sad'] as const;
export type ExpressionId = (typeof EXPRESSIONS)[number];

export type CavemanDesign = {
  style: 'classic' | 'cartoon' | (string & {});
  skin: string;
  clothes?: string;
  clothesColor?: string;
  trousersColor?: string;
  hair?: string;
  hairColor?: string;
  glasses?: string;
  facialHair?: string;
  headSize: number; // 0.8 (small) .. 1.3 (big)
  name?: string;
};

export type Caption = {
  text: string;
  keyword?: string; // the word shown in the mood's highlight colour
  wordArt?: boolean; // numbers / equations drawn as big word-art
  style?: 'yellow' | 'red' | 'white' | 'outlined';
};

/** Position, size and rotation are percentages of the frame so they survive shape switches. */
export type PropPlacement = {
  assetId: string;
  x: number; // centre, % of frame width
  y: number; // centre, % of frame height
  scale: number; // height, % of frame height
  rotation: number;
};

export type Background =
  | { type: 'color'; color: string; manual?: boolean }
  | { type: 'setting'; assetId: string }
  | { type: 'upload'; blobId: string };

export type SceneKind = 'title' | 'line' | 'quiz' | 'recap' | 'end';

export type Scene = {
  id: string;
  kind: SceneKind;
  words: string;
  captions: Caption[];
  motion: MotionId;
  expression: ExpressionId;
  hideCaveman?: boolean;
  background: Background;
  props: PropPlacement[];
  sfx?: string;
  durationMs: number;
  pauseHere?: boolean;
  voice: { type: 'builtin' | 'recorded' | 'none'; blobId?: string; envelope?: number[]; stale?: boolean; voiceId?: string; durationMs?: number };
};

export type Project = {
  id: string;
  formatVersion: 1;
  title: string;
  shape: Shape;
  mood: Mood;
  caveman: CavemanDesign;
  scenes: Scene[];
  seed: number;
  voiceMode: 'builtin' | 'recorded' | 'none';
  voiceId?: string;
  voiceSpeed?: 'slow' | 'normal' | 'fast';
  sfxLevel: 'on' | 'gentle' | 'off';
  readingSpeed: 'slow' | 'normal' | 'fast';
  endCard: boolean;
  sourceText: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  edited?: boolean; // scenes were changed by hand since Make (Re-make asks first)
  extra?: Record<string, unknown>; // unknown / premium fields, kept untouched
};

export type ManifestAsset = {
  id: string;
  file: string;
  kind: 'prop' | 'setting';
  category: string;
  names: string[];
  kidSafeReviewed: boolean;
};
