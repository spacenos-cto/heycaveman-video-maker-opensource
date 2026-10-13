// Undo / Redo for the open video (devpost/spec.md > Scene panel and undo): whole-project snapshots,
// at least 50 steps. Typing in one box counts as one step, not one step per letter.
import type { Project } from '../types';

export const HISTORY_LIMIT = 100;
const MERGE_MS = 1000;

export type History = { past: Project[]; future: Project[]; lastKey?: string; lastAt?: number };

export const emptyHistory = (): History => ({ past: [], future: [] });

/** Remember `before` so it can come back. Changes with the same key within a second merge into one step. */
export function record(h: History, before: Project, key?: string, now = Date.now()): History {
  if (key && key === h.lastKey && now - (h.lastAt ?? 0) < MERGE_MS && h.past.length) return { ...h, future: [], lastAt: now };
  return { past: [...h.past, before].slice(-HISTORY_LIMIT), future: [], lastKey: key, lastAt: now };
}

export function undo(h: History, current: Project): { history: History; project: Project } | null {
  const project = h.past[h.past.length - 1];
  if (!project) return null;
  return { project, history: { past: h.past.slice(0, -1), future: [current, ...h.future] } };
}

export function redo(h: History, current: Project): { history: History; project: Project } | null {
  const project = h.future[0];
  if (!project) return null;
  return { project, history: { past: [...h.past, current].slice(-HISTORY_LIMIT), future: h.future.slice(1) } };
}
