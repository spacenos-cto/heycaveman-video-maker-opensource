// Everything is saved on this device, in the browser's own database (IndexedDB). If the browser blocks
// storage (private window, school policy), the same calls keep working in memory for this session only
// and `storageBlocked` tells the app to show its banner (devpost/prd.md > F1, F14).
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Project } from '../types';

export type Settings = {
  seenTips: Record<string, true>;
  myCaveman?: Project['caveman'];
  classroomMode?: boolean;
  theme?: 'light' | 'dark' | 'system';
};

interface StoneAgeDB extends DBSchema {
  projects: { key: string; value: Project; indexes: { updatedAt: number } };
  blobs: { key: string; value: { id: string; blob: Blob } };
  settings: { key: string; value: unknown };
}

type Backend = {
  getProject(id: string): Promise<Project | undefined>;
  putProject(p: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  allProjects(): Promise<Project[]>;
  getSetting<T>(key: string): Promise<T | undefined>;
  putSetting(key: string, value: unknown): Promise<void>;
};

function memoryBackend(): Backend {
  const projects = new Map<string, Project>();
  const settings = new Map<string, unknown>();
  return {
    getProject: async (id) => structuredClone(projects.get(id)),
    putProject: async (p) => void projects.set(p.id, structuredClone(p)),
    deleteProject: async (id) => void projects.delete(id),
    allProjects: async () => [...projects.values()].map((p) => structuredClone(p)),
    getSetting: async <T,>(key: string) => settings.get(key) as T | undefined,
    putSetting: async (key, value) => void settings.set(key, value),
  };
}

function idbBackend(db: IDBPDatabase<StoneAgeDB>): Backend {
  return {
    getProject: (id) => db.get('projects', id),
    putProject: async (p) => void (await db.put('projects', p)),
    deleteProject: (id) => db.delete('projects', id),
    allProjects: () => db.getAll('projects'),
    getSetting: async <T,>(key: string) => (await db.get('settings', key)) as T | undefined,
    putSetting: async (key, value) => void (await db.put('settings', value, key)),
  };
}

let backend: Promise<Backend> | null = null;
export let storageBlocked = false;

export function storage(): Promise<Backend> {
  backend ??= (async () => {
    try {
      if (typeof indexedDB === 'undefined') throw new Error('no IndexedDB');
      const db = await openDB<StoneAgeDB>('stoneage', 1, {
        upgrade(d) {
          const projects = d.createObjectStore('projects', { keyPath: 'id' });
          projects.createIndex('updatedAt', 'updatedAt');
          d.createObjectStore('blobs', { keyPath: 'id' });
          d.createObjectStore('settings');
        },
      });
      // Ask the browser not to clear our data under storage pressure (allowed to say no).
      void navigator.storage?.persist?.().catch(() => undefined);
      return idbBackend(db);
    } catch {
      storageBlocked = true;
      return memoryBackend();
    }
  })();
  return backend;
}

/** For tests: start again with a fresh backend. */
export function resetStorageForTests() {
  backend = null;
  storageBlocked = false;
}

export const RECENTLY_DELETED_DAYS = 30;

/** Remove projects deleted more than 30 days ago (run when the app opens). */
export async function purgeOldDeleted(now = Date.now()): Promise<number> {
  const db = await storage();
  const cutoff = now - RECENTLY_DELETED_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const p of await db.allProjects()) {
    if (p.deletedAt && p.deletedAt < cutoff) {
      await db.deleteProject(p.id);
      removed++;
    }
  }
  return removed;
}
