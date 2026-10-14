// Settings that outlive one video (devpost/spec.md > Data Model > Settings): My caveman, defaults for new
// videos, Classroom mode, theme, dismissed tips. One object in IndexedDB; in memory if storage is blocked.
import { create } from 'zustand';
import { CAVEY } from '../caveman/presets';
import { storage } from '../storage/db';
import type { CavemanDesign, Mood, Project, Shape } from '../types';

export type Theme = 'light' | 'dark' | 'system';

export type Settings = {
  myCaveman?: CavemanDesign;
  classroomMode: boolean;
  theme: Theme;
  uiSounds: boolean;
  defaults: {
    shape: Shape;
    mood: Mood;
    sfxLevel: Project['sfxLevel'];
    endCard: boolean;
    readingSpeed: Project['readingSpeed'];
  };
  dismissed: Record<string, true>;
};

export const DEFAULT_SETTINGS: Settings = {
  classroomMode: false,
  theme: 'dark',
  uiSounds: true,
  defaults: { shape: 'wide', mood: 'bright', sfxLevel: 'gentle', endCard: true, readingSpeed: 'normal' },
  dismissed: {},
};

const KEY = 'app';
const MET_KEY = 'stoneage.metCaveman'; // kept in localStorage so the first Make knows at once

function readMet(): boolean {
  try {
    return localStorage.getItem(MET_KEY) === '1';
  } catch {
    return false;
  }
}

type SettingsState = Settings & {
  loaded: boolean;
  /** Has this device seen "Meet your caveman"? */
  met: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  setDefaults: (patch: Partial<Settings['defaults']>) => void;
  markMet: () => void;
  dismiss: (id: string) => void;
};

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,
  met: readMet(),
  load: async () => {
    const saved = await (await storage()).getSetting<Partial<Settings>>(KEY);
    const classroom = new URLSearchParams(location.search).has('classroom');
    set({
      ...DEFAULT_SETTINGS,
      ...saved,
      defaults: { ...DEFAULT_SETTINGS.defaults, ...saved?.defaults },
      dismissed: { ...saved?.dismissed },
      classroomMode: classroom || !!saved?.classroomMode,
      loaded: true,
    });
  },
  update: (patch) => {
    set(patch);
    const { myCaveman, classroomMode, theme, uiSounds, defaults, dismissed } = get();
    void storage().then((db) => db.putSetting(KEY, { myCaveman, classroomMode, theme, uiSounds, defaults, dismissed }));
  },
  setDefaults: (patch) => get().update({ defaults: { ...get().defaults, ...patch } }),
  markMet: () => {
    try {
      localStorage.setItem(MET_KEY, '1');
    } catch {
      /* storage blocked: this session only */
    }
    set({ met: true });
  },
  dismiss: (id) => get().update({ dismissed: { ...get().dismissed, [id]: true } }),
}));

/** What a new video starts with: the shape and mood picked last, and My caveman. */
export function projectDefaults(): Pick<Project, 'shape' | 'mood' | 'caveman' | 'readingSpeed'> & Pick<Project, 'sfxLevel' | 'endCard'> {
  const s = useSettings.getState();
  return { shape: s.defaults.shape, mood: s.defaults.mood, caveman: s.myCaveman ?? CAVEY, readingSpeed: s.defaults.readingSpeed, sfxLevel: s.defaults.sfxLevel, endCard: s.defaults.endCard };
}
