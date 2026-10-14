// App state: which screen is showing, the draft lesson and the open project. Every project change is
// auto-saved on this device a moment later; there is no "unsaved" state (devpost/prd.md > F14).
import { create } from 'zustand';
import { CAVEY } from '../caveman/presets';
import { useOffline } from '../offline/status';
import { storage, storageBlocked } from '../storage/db';
import { packProject, projectFileName, unpackProject } from '../storage/projectFile';
import { claimProject, releaseProject } from '../storage/tabs';
import type { Project } from '../types';
import { loadUploads, uploadIds } from '../editor/uploads';
import { emptyHistory, record, redo as redoStep, undo as undoStep, type History } from './history';

export type Screen = 'start' | 'making' | 'player' | 'editor' | 'videos';

const DRAFT_KEY = 'stoneage.draft';
const AUTOSAVE_MS = 300;

function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
}

type AppState = {
  screen: Screen;
  draft: string;
  project: Project | null;
  readOnly: boolean;
  projects: Project[]; // My videos, newest first (includes recently deleted)
  notice: string | null; // one-time notes such as the first-save warning
  history: History;
  /** Set when Make should replace this edited video in place (the Re-make prompt said yes). */
  remakeId: string | null;
  /** Which scene the Editor opens on. */
  editorStart: number;
  setDraft: (text: string) => void;
  go: (screen: Screen) => void;
  /** Replace the open project (auto-saved). Changes to the same video can be undone; `key` merges typing into one step. */
  setProject: (project: Project | null, key?: string) => void;
  undo: () => void;
  redo: () => void;
  setRemakeId: (id: string | null) => void;
  openProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  renameProject: (id: string, title: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  saveProjectFile: (project: Project) => void;
  openProjectFile: (file: File) => Promise<{ newer: boolean }>;
  dismissNotice: () => void;
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;

async function persist(project: Project) {
  const db = await storage();
  await db.putProject(project);
  useOffline.setState({ storageBlocked });
}

async function firstSaveNotice(set: (s: Partial<AppState>) => void) {
  const db = await storage();
  const seen = (await db.getSetting<Record<string, true>>('seenTips')) ?? {};
  if (seen.firstSave) return;
  set({ notice: 'Videos are saved in this browser only. Clearing browser data removes them — use Save project file to keep a copy.' });
  await db.putSetting('seenTips', { ...seen, firstSave: true });
}

const newId = () => `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

function download(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const useApp = create<AppState>((set, get) => ({
  screen: 'start',
  draft: readDraft(),
  project: null,
  readOnly: false,
  projects: [],
  notice: null,
  history: emptyHistory(),
  remakeId: null,
  editorStart: 0,
  setDraft: (draft) => {
    try {
      localStorage.setItem(DRAFT_KEY, draft);
    } catch {
      /* storage blocked: the draft lasts this session only */
    }
    set({ draft });
  },
  go: (screen) => {
    if (screen !== 'player' && screen !== 'editor') {
      releaseProject();
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    }
    set({ screen });
    if (screen === 'videos') void get().refreshProjects();
  },
  setProject: (project, key) => {
    const before = get().project;
    const isNew = project && project.id !== before?.id;
    if (project && before && !isNew && project !== before && !get().readOnly) set({ history: record(get().history, before, key) });
    if (isNew || !project) set({ history: emptyHistory() });
    set({ project });
    if (!project) return;
    if (isNew) {
      void loadUploads(project);
      if (location.hash !== `#project=${project.id}`) history.replaceState(null, '', `#project=${project.id}`);
      void claimProject(project.id).then((busy) => {
        set({ readOnly: busy });
        useOffline.setState({ otherTab: busy });
      });
      void firstSaveNotice(set);
    }
    if (get().readOnly) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void persist({ ...project, updatedAt: Date.now() }), AUTOSAVE_MS);
  },
  openProject: async (id) => {
    const db = await storage();
    const p = await db.getProject(id);
    if (!p || p.deletedAt) return;
    get().setProject(p);
    set({ screen: 'player' });
  },
  refreshProjects: async () => {
    const db = await storage();
    const all = await db.allProjects();
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ projects: all });
    useOffline.setState({ storageBlocked });
  },
  renameProject: async (id, title) => {
    const db = await storage();
    const p = await db.getProject(id);
    if (!p || !title.trim()) return;
    await db.putProject({ ...p, title: title.trim(), updatedAt: Date.now() });
    if (get().project?.id === id) set({ project: { ...get().project!, title: title.trim() } });
    await get().refreshProjects();
  },
  duplicateProject: async (id) => {
    const db = await storage();
    const p = await db.getProject(id);
    if (!p) return;
    const now = Date.now();
    await db.putProject({ ...structuredClone(p), id: newId(), title: `${p.title} (copy)`, createdAt: now, updatedAt: now, deletedAt: undefined });
    await get().refreshProjects();
  },
  deleteProject: async (id) => {
    const db = await storage();
    const p = await db.getProject(id);
    if (!p) return;
    await db.putProject({ ...p, deletedAt: Date.now() });
    await get().refreshProjects();
  },
  restoreProject: async (id) => {
    const db = await storage();
    const p = await db.getProject(id);
    if (!p) return;
    await db.putProject({ ...p, deletedAt: undefined, updatedAt: Date.now() });
    await get().refreshProjects();
  },
  saveProjectFile: (project) =>
    void (async () => {
      const db = await storage();
      const audio: Record<string, Uint8Array> = {};
      for (const s of project.scenes) {
        const blob = s.voice.blobId ? await db.getBlob(s.voice.blobId) : undefined;
        if (blob && s.voice.blobId) audio[s.voice.blobId] = new Uint8Array(await blob.arrayBuffer());
      }
      const images: Record<string, Uint8Array> = {};
      for (const id of uploadIds(project)) {
        const blob = await db.getBlob(id);
        if (blob) images[id] = new Uint8Array(await blob.arrayBuffer());
      }
      download(packProject(project, audio, images), projectFileName(project.title), 'application/zip');
    })(),
  openProjectFile: async (file) => {
    const { project, newer, audio, images } = unpackProject(new Uint8Array(await file.arrayBuffer()));
    const db = await storage();
    for (const [id, bytes] of Object.entries(audio)) await db.putBlob(id, new Blob([bytes as BlobPart], { type: 'audio/wav' }));
    for (const [id, bytes] of Object.entries(images)) await db.putBlob(id, new Blob([bytes as BlobPart], { type: 'image/webp' }));
    // Opening someone else's copy of a project you already have makes a separate copy, never overwrites.
    const existing = await db.getProject(project.id);
    const p = existing ? { ...project, id: newId(), updatedAt: Date.now() } : { ...project, updatedAt: Date.now() };
    await db.putProject(p);
    get().setProject(p);
    set({ screen: 'player' });
    return { newer };
  },
  // setProject records a step too; the step's own history replaces it straight after.
  undo: () => {
    const { project, history, readOnly } = get();
    const step = project && !readOnly ? undoStep(history, project) : null;
    if (!step) return;
    get().setProject(step.project);
    set({ history: step.history });
  },
  redo: () => {
    const { project, history, readOnly } = get();
    const step = project && !readOnly ? redoStep(history, project) : null;
    if (!step) return;
    get().setProject(step.project);
    set({ history: step.history });
  },
  setRemakeId: (remakeId) => set({ remakeId }),
  dismissNotice: () => set({ notice: null }),
}));

export const DEFAULTS = { shape: 'wide' as const, mood: 'bright' as const, caveman: CAVEY, readingSpeed: 'normal' as const };
