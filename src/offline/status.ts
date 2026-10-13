// What the header and banners show about offline readiness, updates, install, storage and other tabs
// (devpost/prd.md > F1 States). The service worker only runs in the built app (npm run build/preview).
import { create } from 'zustand';

type Readiness = 'unknown' | 'saving' | 'ready' | 'unsupported';

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

type OfflineState = {
  readiness: Readiness;
  progress: number; // 0..100 while saving
  justReady: boolean; // show "✓ Works offline" once, then the dot
  online: boolean;
  updateReady: boolean;
  canInstall: boolean;
  lowSpace: boolean;
  storageBlocked: boolean;
  otherTab: boolean; // this project is open in another tab: read-only here
};

export const useOffline = create<OfflineState>(() => ({
  readiness: 'unknown',
  progress: 0,
  justReady: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  updateReady: false,
  canInstall: false,
  lowSpace: false,
  storageBlocked: false,
  otherTab: false,
}));

let installEvent: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;

export async function installApp() {
  if (!installEvent) return;
  await installEvent.prompt();
  installEvent = null;
  useOffline.setState({ canInstall: false });
}

/** Reload into the new version, after the caller has saved (never automatic while editing). */
export function applyUpdate() {
  if (!waitingWorker) return location.reload();
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

const LOW_SPACE_BYTES = 200 * 1024 * 1024;

export async function checkSpace() {
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.quota != null && est.usage != null) useOffline.setState({ lowSpace: est.quota - est.usage < LOW_SPACE_BYTES });
  } catch {
    /* estimate unavailable: say nothing */
  }
}

export function startOfflineStatus() {
  addEventListener('online', () => useOffline.setState({ online: true }));
  addEventListener('offline', () => useOffline.setState({ online: false }));
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as BeforeInstallPromptEvent;
    useOffline.setState({ canInstall: true });
  });
  void checkSpace();

  if (!('serviceWorker' in navigator)) {
    useOffline.setState({ readiness: 'unsupported' });
    return;
  }
  if (import.meta.env.DEV) return; // no service worker while developing
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data;
    if (d?.type === 'sw-progress') useOffline.setState({ readiness: 'saving', progress: Math.round((d.done / d.total) * 100) });
    if (d?.type === 'sw-ready') useOffline.setState((s) => ({ readiness: 'ready', progress: 100, justReady: s.readiness === 'saving' }));
  });
  void navigator.serviceWorker
    .register('/sw.js', { type: 'module', scope: '/' })
    .then((reg) => {
      if (reg.active && !reg.installing) useOffline.setState({ readiness: 'ready', progress: 100 });
      else useOffline.setState({ readiness: 'saving' });
      const watch = (w: ServiceWorker | null) => {
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = w;
            useOffline.setState({ updateReady: true });
          }
          if (w.state === 'activated') useOffline.setState((s) => ({ readiness: 'ready', progress: 100, justReady: s.readiness !== 'ready' }));
        });
      };
      watch(reg.installing);
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        useOffline.setState({ updateReady: true });
      }
      reg.addEventListener('updatefound', () => watch(reg.installing));
    })
    .catch(() => useOffline.setState({ readiness: 'unsupported' }));
}
