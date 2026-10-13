// App state: which screen is showing, the draft lesson and the open project.
// Draft text lives in localStorage so it survives leaving and coming back (devpost/spec.md > Data Model).
import { create } from 'zustand';
import { CAVEY } from '../caveman/presets';
import type { Project } from '../types';

export type Screen = 'start' | 'making' | 'player';

const DRAFT_KEY = 'stoneage.draft';

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
  setDraft: (text: string) => void;
  go: (screen: Screen) => void;
  setProject: (project: Project | null) => void;
};

export const useApp = create<AppState>((set) => ({
  screen: 'start',
  draft: readDraft(),
  project: null,
  setDraft: (draft) => {
    try {
      localStorage.setItem(DRAFT_KEY, draft);
    } catch {
      /* storage blocked: the draft lasts this session only */
    }
    set({ draft });
  },
  go: (screen) => set({ screen }),
  setProject: (project) => set({ project }),
}));

export const DEFAULTS = { shape: 'wide' as const, mood: 'bright' as const, caveman: CAVEY, readingSpeed: 'normal' as const };
