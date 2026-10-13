// The app shell: header on every screen, then the current screen (devpost/spec.md > App shell and navigation).
import { en } from './i18n/en';
import { MakingScreen } from './screens/MakingScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { StartScreen } from './screens/StartScreen';
import { useApp } from './store/app';
import { Logo } from './ui/Logo';

export function App() {
  const screen = useApp((s) => s.screen);
  const go = useApp((s) => s.go);
  return (
    <div className="min-h-screen">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => go('start')} className="flex items-center gap-2 rounded-[12px]" aria-label="HeyCaveman Stone Age — home">
            <Logo />
            <span className="font-display text-xl font-bold">{en.appName}</span>
            <span className="rounded-full bg-sand px-2 py-0.5 font-display text-xs font-semibold text-ash">{en.edition}</span>
          </button>
        </div>
      </header>
      {screen === 'start' && <StartScreen />}
      {screen === 'making' && <MakingScreen />}
      {screen === 'player' && <PlayerScreen />}
    </div>
  );
}
