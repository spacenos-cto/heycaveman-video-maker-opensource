// The app shell: header on every screen, status banners, then the current screen
// (devpost/spec.md > App shell and navigation). A reload with #project=<id> reopens that project.
import { useEffect } from 'react';
import { Download, Film } from 'lucide-react';
import { en } from './i18n/en';
import { installApp, useOffline } from './offline/status';
import { MakingScreen } from './screens/MakingScreen';
import { PlayerScreen } from './screens/PlayerScreen';
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

  useEffect(() => {
    void purgeOldDeleted().then(() => useApp.getState().refreshProjects());
    const id = location.hash.match(/^#project=([\w-]+)$/)?.[1];
    if (id) void useApp.getState().openProject(id);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => go('start')} className="flex items-center gap-2 rounded-[12px]" aria-label="HeyCaveman Stone Age — home">
            <Logo />
            <span className="font-display text-xl font-bold">{en.appName}</span>
            <span className="rounded-full bg-sand px-2 py-0.5 font-display text-xs font-semibold text-ash">{en.edition}</span>
          </button>
          <nav className="ml-auto flex items-center gap-3" aria-label="Main">
            <OfflineIndicator />
            <button type="button" onClick={() => go('videos')} className="flex items-center gap-1.5 rounded-[12px] px-2 py-1 font-display font-semibold hover:bg-sand" aria-current={screen === 'videos' ? 'page' : undefined}>
              <Film size={18} aria-hidden="true" /> {en.videos.nav}
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
      {screen === 'start' && <StartScreen />}
      {screen === 'making' && <MakingScreen />}
      {screen === 'player' && <PlayerScreen />}
      {screen === 'videos' && <VideosPage />}
    </div>
  );
}
