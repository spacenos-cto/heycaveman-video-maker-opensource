// The .caveman project file: one zip holding project.json (and later its recordings and pictures).
// Fields this version doesn't know (from a newer version or HeyCaveman premium) are kept untouched,
// so "Same file, bigger world" holds both ways (devpost/prd.md > Product Decisions, F14).
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { Project } from '../types';

export const FORMAT_VERSION = 1;
export const FILE_EXTENSION = '.caveman';

const KNOWN: (keyof Project)[] = [
  'id', 'formatVersion', 'title', 'shape', 'mood', 'caveman', 'scenes', 'seed', 'voiceMode', 'sfxLevel',
  'readingSpeed', 'endCard', 'sourceText', 'createdAt', 'updatedAt', 'deletedAt',
];

export class ProjectFileError extends Error {}

/** Project → the exact JSON written into the file (unknown fields restored at the top level). */
export function toFileJson(project: Project): Record<string, unknown> {
  const { extra, ...known } = project;
  const out: Record<string, unknown> = { ...(extra ?? {}), ...known, formatVersion: FORMAT_VERSION };
  delete out.deletedAt;
  return out;
}

export function fromFileJson(json: unknown): { project: Project; newer: boolean } {
  if (!json || typeof json !== 'object') throw new ProjectFileError('not a project');
  const o = json as Record<string, unknown>;
  if (!Array.isArray(o.scenes) || typeof o.id !== 'string' || typeof o.caveman !== 'object') throw new ProjectFileError('not a project');
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (!(KNOWN as string[]).includes(k)) extra[k] = v;
  const newer = typeof o.formatVersion === 'number' && o.formatVersion > FORMAT_VERSION;
  const project = { ...o, formatVersion: 1, extra: Object.keys(extra).length ? extra : undefined } as Project;
  for (const k of Object.keys(extra)) delete (project as Record<string, unknown>)[k];
  return { project, newer };
}

export function packProject(project: Project): Uint8Array {
  return zipSync({ 'project.json': strToU8(JSON.stringify(toFileJson(project), null, 1)) }, { level: 6 });
}

export function unpackProject(bytes: Uint8Array): { project: Project; newer: boolean } {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new ProjectFileError('not a zip');
  }
  const json = files['project.json'];
  if (!json) throw new ProjectFileError('no project.json');
  try {
    return fromFileJson(JSON.parse(strFromU8(json)));
  } catch (e) {
    if (e instanceof ProjectFileError) throw e;
    throw new ProjectFileError('bad json');
  }
}

export function projectFileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'lesson';
  return `${slug}${FILE_EXTENSION}`;
}
