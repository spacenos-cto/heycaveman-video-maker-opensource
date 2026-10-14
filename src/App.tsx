// The app shell: header on every screen, status banners, then the current screen
// (devpost/spec.md > App shell and navigation). A reload with #project=<id> reopens that project.
import { useEffect, useState } from 'react';
import { CavemanRig } from './caveman/CavemanRig';
import { CavemanSheet } from './caveman/CavemanSheet';
import { CAVEY } from './caveman/presets';
import { useSettings } from './store/settings';
import { Download, Film, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { ui } from './ui/uiSounds';
import { en } from './i18n/en';
import { installApp, useOffline } from './offline/status';
import { MakingScreen } from './screens/MakingScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { EditorScreen } from './editor/EditorScreen';
import { StartScreen } from './screens/StartScreen';
import { VideosPage } from './screens/VideosPage';
import { AboutPage, HelpPage, SettingsPage } from './screens/InfoPages';
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

  // Appearance (Settings): Paper (default), Night, or follow the device.
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
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    void useSettings.getState().load();
    void purgeOldDeleted().then(() => useApp.getState().refreshProjects());
    const id = location.hash.match(/^#project=([\w-]+)$/)?.[1];
    if (id) void useApp.getState().openProject(id);
  }, []);

  const pill = 'flex h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-black bg-white px-4 text-[13px] font-extrabold uppercase tracking-[0.035em] transition-transform duration-200 hover:-rotate-2 hover:bg-sun';
  return (
    <div className="frame">
      <div className="sheet">
      <div className="marquee" aria-hidden="true">
        <div>
          {Array.from({ length: 2 }, (_, k) => en.marquee.map((m, i) => <span key={`${k}-${i}`}>{m} ✦</span>))}
        </div>
      </div>
      <header className="relative z-40">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-3 sm:px-6">
          <button type="button" onClick={() => go('start')} className="wiggle flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-black bg-white" aria-label="HeyCaveman Stone Age — home">
            <Logo size={34} />
          </button>
          <button type="button" onClick={() => go('start')} className="ml-1 hidden font-display text-2xl leading-none sm:block" tabIndex={-1} aria-hidden="true">
            {en.appName} <span className="text-violet">{en.edition}</span>
          </button>
          <nav className="ml-auto flex items-center gap-1.5" aria-label="Main">
            <OfflineIndicator />
            <button type="button" onClick={() => useSettings.getState().update({ uiSounds: !uiSounds })} className={`${pill} w-11 px-0`} aria-label={uiSounds ? en.uiSoundsOff : en.uiSoundsOn} aria-pressed={uiSounds} title={uiSounds ? en.uiSoundsOff : en.uiSoundsOn}>
              {uiSounds ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
            </button>
            <button type="button" disabled={!settingsLoaded} onClick={() => setEditMine(true)} className="wiggle flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-black bg-lavender" aria-label={en.caveman.avatar} title={en.caveman.avatar} data-testid="my-caveman">
              <svg viewBox="30 10 140 140" className="h-full w-full" aria-hidden="true">
                <CavemanRig design={myCaveman ?? CAVEY} motion="idle" expression="happy" frame={0} talking={false} />
              </svg>
            </button>
            {canInstall && (
              <button type="button" onClick={() => void installApp()} className={`${pill} hidden sm:flex`}>
                <Download size={16} aria-hidden="true" /> {en.offline.install}
              </button>
            )}
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} className={`${pill} w-11 px-0`} aria-label={en.info.more} aria-expanded={menu} aria-haspopup="menu">
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
              {menu && (
                <div role="menu" className="pop-in absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-[20px] border-[1.5px] border-black bg-white" onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}>
                  {(['settings', 'help', 'about'] as const).map((k) => (
                    <button key={k} type="button" role="menuitem" onClick={() => { setMenu(false); go(k); }} className="block w-full border-b border-black/10 px-4 py-2.5 text-left text-sm font-extrabold uppercase tracking-[0.03em] last:border-0 hover:bg-sun">
                      {en.info[k]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => go('videos')} className="flex h-11 items-center gap-1.5 rounded-full bg-black px-4 text-[13px] font-extrabold uppercase tracking-[0.035em] text-white transition-transform duration-200 hover:-rotate-2 hover:bg-ember hover:text-black" aria-current={screen === 'videos' ? 'page' : undefined} aria-label={en.videos.nav}>
              <Film size={17} aria-hidden="true" /> <span className="hidden sm:inline">{en.videos.nav}</span>
            </button>
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
        {screen === 'settings' && <SettingsPage onEditCaveman={() => setEditMine(true)} />}
        {screen === 'help' && <HelpPage />}
        {screen === 'about' && <AboutPage />}
      </div>
      </div>
    </div>
  );
}
