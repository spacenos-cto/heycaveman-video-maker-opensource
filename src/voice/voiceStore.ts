// Voice download and voicing state that outlives the panel: the download keeps going while you watch
// (devpost/prd.md > F10 "Progress bar with %; can keep editing meanwhile").
import { create } from 'zustand';
import { useApp } from '../store/app';
import { listVoices, loadVoices, voicesDownloaded, voicesSupported, type VoiceInfo } from './voiceClient';
import { voiceProject, type SPEEDS } from './voicing';

export const DEFAULT_VOICE = 'af_heart';

type VoiceState = {
  status: 'unknown' | 'unsupported' | 'not-downloaded' | 'downloading' | 'ready' | 'failed';
  progress: number; // 0..100 while downloading
  voices: VoiceInfo[];
  voicing: { done: number; total: number } | null;
  error: string | null;
  check: () => Promise<void>;
  download: (thenVoice?: boolean) => Promise<void>;
  voiceOpenProject: (voiceId: string, speed: keyof typeof SPEEDS) => Promise<void>;
};

export const useVoice = create<VoiceState>((set, get) => ({
  status: 'unknown',
  progress: 0,
  voices: [],
  voicing: null,
  error: null,
  check: async () => {
    if (get().status !== 'unknown') return;
    if (!voicesSupported()) return set({ status: 'unsupported' });
    set({ status: (await voicesDownloaded()) ? 'ready' : 'not-downloaded' });
  },
  download: async (thenVoice = true) => {
    if (get().status === 'downloading') return;
    set({ status: 'downloading', progress: 0, error: null });
    try {
      await loadVoices((loaded, total) => total && set({ progress: Math.min(99, Math.round((loaded / total) * 100)) }));
      const voices = (await listVoices()).filter((v) => /^en/i.test(v.language));
      set({ status: 'ready', progress: 100, voices });
      if (thenVoice && useApp.getState().project) await get().voiceOpenProject(DEFAULT_VOICE, 'normal');
    } catch (e) {
      set({ status: 'failed', error: e instanceof Error ? e.message : String(e) });
    }
  },
  voiceOpenProject: async (voiceId, speed) => {
    const project = useApp.getState().project;
    if (!project || get().voicing) return;
    if (get().status !== 'ready') return get().download(false).then(() => get().voiceOpenProject(voiceId, speed));
    // Show progress straight away: starting the model offline can take a few seconds.
    set({ voicing: { done: 0, total: project.scenes.length }, error: null });
    try {
      if (!get().voices.length) set({ voices: (await listVoices()).filter((v) => /^en/i.test(v.language)) });
      const voiced = await voiceProject(project, voiceId, speed, (done, total) => set({ voicing: { done, total } }), () => useApp.getState().project?.id !== project.id);
      if (useApp.getState().project?.id === project.id) useApp.getState().setProject(voiced);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ voicing: null });
    }
  },
}));
