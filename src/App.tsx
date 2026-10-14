// The app shell: header on every screen, status banners, then the current screen
// (devpost/spec.md > App shell and navigation). A reload with #project=<id> reopens that project.
import { useEffect, useState } from 'react';
import { CavemanRig } from './caveman/CavemanRig';
import { CavemanSheet } from './caveman/CavemanSheet';
import { CAVEY } from './caveman/presets';
import { useSettings } from './store/settings';
import { Download, Film, Volume2, VolumeX } from 'lucide-react';
import { ui } from './ui/uiSounds';
import { en } from './i18n/en';
import { installApp, useOffline } from './offline/status';
import { MakingScreen } from './screens/MakingScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { EditorScreen } from './editor/EditorScreen';
import { StartScreen } from './screens/StartScreen';
import { VideosPage } from './screens/VideosPage';
import { purgeOldDeleted } from './storage/db';
import { useApp } from './store/app';
import { Logo } from './ui/Logo';
import { OfflineIndicator, StatusBanners } from './ui/StatusBanners';

export function App() {
  const screen = useApp((s) => s.screen);
  const go = useApp((s) => s.go);
  const canInstall = useOffline((s) => s.canInstall);
  const myCaveman = useSettings((s) => s.myCaveman);
  const settingsLoaded = useSettings((s) => s.loaded);
  const uiSounds = useSettings((s) => s.uiSounds);
  const theme = useSettings((s) => s.theme);

  // Appearance: dark (default), light, or follow the device.
  useEffect(() => {
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  // A soft tick for every press, a whoosh between screens.
  useEffect(() => {
    const onPress = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.('button:not(:disabled), [role=tab], label:has(input), a, select')) ui.tap();
    };
    document.addEventListener('pointerdown', onPress);
    return () => document.removeEventListener('pointerdown', onPress);
  }, []);
  useEffect(() => ui.whoosh(), [screen]);
  const [editMine, setEditMine] = useState(false);

  useEffect(() => {
    void useSettings.getState().load();
    void purgeOldDeleted().then(() => useApp.getState().refreshProjects());
    const id = location.hash.match(/^#project=([\w-]+)$/)?.[1];
    if (id) void useApp.getState().openProject(id);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="sky" aria-hidden="true">
        <div className="aurora a1" />
        <div className="aurora a2" />
        <div className="aurora a3" />
        <div className="aurora a4" />
        <div className="stars" />
        <div className="grain" />
      </div>
      <header className="sticky top-0 z-40 border-b border-hairline bg-[rgb(7_7_13/0.55)] backdrop-blur-xl [[data-theme=light]_&]:bg-[rgb(245_242_255/0.6)]">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => go('start')} className="flex items-center gap-2 rounded-[12px]" aria-label="HeyCaveman Stone Age — home">
            <Logo />
            <span className="font-display text-lg font-bold">{en.appName}</span>
            <span className="hidden whitespace-nowrap rounded-full border border-hairline bg-bone px-2.5 py-0.5 font-display text-[10px] sm:inline font-semibold uppercase tracking-[0.18em] text-terracotta">{en.edition}</span>
          </button>
          <nav className="ml-auto flex items-center gap-1.5 sm:gap-3" aria-label="Main">
            <OfflineIndicator />
            <button type="button" disabled={!settingsLoaded} onClick={() => setEditMine(true)} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[conic-gradient(from_200deg,#ffc15e,#ff4f8b,#c94dff,#3df5ff,#ffc15e)] p-[2px] transition-transform hover:scale-110" aria-label={en.caveman.avatar} title={en.caveman.avatar} data-testid="my-caveman">
              <svg viewBox="30 10 140 140" className="rig-stage h-full w-full rounded-full" aria-hidden="true">
                <CavemanRig design={myCaveman ?? CAVEY} motion="idle" expression="happy" frame={0} talking={false} />
              </svg>
            </button>
            <button type="button" onClick={() => useSettings.getState().update({ uiSounds: !uiSounds })} className="flex h-10 w-10 items-center justify-center rounded-full text-ash hover:bg-bone hover:text-charcoal" aria-label={uiSounds ? en.uiSoundsOff : en.uiSoundsOn} aria-pressed={uiSounds} title={uiSounds ? en.uiSoundsOff : en.uiSoundsOn}>
              {uiSounds ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => go('videos')} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-semibold hover:bg-bone" aria-current={screen === 'videos' ? 'page' : undefined} aria-label={en.videos.nav}>
              <Film size={18} aria-hidden="true" /> <span className="hidden sm:inline">{en.videos.nav}</span>
            </button>
            {canInstall && (
              <button type="button" onClick={() => void installApp()} className="sticker flex items-center gap-1.5 bg-bone px-3 py-1 font-display font-semibold">
                <Download size={16} aria-hidden="true" /> {en.offline.install}
              </button>
            )}
          </nav>
        </div>
      </header>
      <StatusBanners />
      {editMine && (
        <CavemanSheet
          mode="mine"
          initial={myCaveman ?? CAVEY}
          onCancel={() => setEditMine(false)}
          onDone={(design) => {
            useSettings.getState().update({ myCaveman: design });
            useSettings.getState().markMet();
            setEditMine(false);
          }}
        />
      )}
      <div key={screen} className="screen-in">
        {screen === 'start' && <StartScreen />}
        {screen === 'making' && <MakingScreen />}
        {screen === 'player' && <PlayerScreen />}
        {screen === 'editor' && <EditorScreen />}
        {screen === 'videos' && <VideosPage />}
      </div>
    </div>
  );
}
