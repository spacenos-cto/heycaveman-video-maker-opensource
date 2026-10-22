// Banners and the readiness strip (devpost/prd.md > F1 States). Calm and informational, never pop-ups.
import { useEffect } from 'react';
import { en } from '../i18n/en';
import { applyUpdate, useOffline } from '../offline/status';
import { useApp } from '../store/app';
import { Button } from './Button';

function Banner({ tone, children, testid }: { tone: 'info' | 'warn' | 'ok'; children: React.ReactNode; testid?: string }) {
  const tones = { info: 'border-river', warn: 'border-ochre bg-[#FFF4D6]', ok: 'border-moss' };
  return (
    <div role="status" data-testid={testid} className={`mx-auto mt-3 flex max-w-[1100px] flex-wrap items-center gap-3 rounded-[12px] border-2 bg-bone px-4 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function StatusBanners() {
  const s = useOffline();
  const { notice, dismissNotice, project, screen } = useApp();

  useEffect(() => {
    if (!s.justReady) return;
    const t = setTimeout(() => useOffline.setState({ justReady: false }), 5000);
    return () => clearTimeout(t);
  }, [s.justReady]);

  return (
    <div className="px-4">
      {s.readiness === 'saving' && (
        <div className="mx-auto mt-2 max-w-[1100px] text-sm text-ash" data-testid="offline-strip">
          {en.offline.saving(s.progress)}
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-river transition-[width]" style={{ width: `${s.progress}%` }} />
          </div>
        </div>
      )}
      {s.justReady && (
        <Banner tone="ok" testid="offline-ready">
          <span className="text-moss">{en.offline.ready}</span>
        </Banner>
      )}
      {s.readiness === 'unsupported' && <Banner tone="info">{en.offline.oldBrowser}</Banner>}
      {s.updateReady && (
        <Banner tone="info">
          <span className="flex-1">{en.offline.update}</span>
          <Button onClick={applyUpdate}>{en.offline.reload}</Button>
        </Banner>
      )}
      {s.storageBlocked && (
        <Banner tone="warn" testid="storage-blocked">
          <span className="flex-1">{en.offline.storageBlocked}</span>
          {project && <Button onClick={() => useApp.getState().saveProjectFile(project)}>{en.saveProjectFile}</Button>}
        </Banner>
      )}
      {s.lowSpace && <Banner tone="warn">{en.offline.lowSpace}</Banner>}
      {s.otherTab && <Banner tone="warn" testid="other-tab">{en.offline.otherTab}</Banner>}
      {/* The Player says this in its side card instead (PRD PLAYER-1). */}
      {notice && screen !== 'player' && (
        <Banner tone="info">
          <span className="flex-1">{notice}</span>
          <Button variant="ghost" onClick={dismissNotice}>{en.offline.dismiss}</Button>
        </Banner>
      )}
    </div>
  );
}

export function OfflineIndicator() {
  const { readiness, online } = useOffline();
  if (!online) {
    return (
      <span className="rounded-full bg-sand px-3 py-1 font-display text-sm font-semibold text-ash" data-testid="offline-pill">
        {en.offline.offlinePill}
      </span>
    );
  }
  if (readiness === 'ready') {
    return <span className="inline-block h-3 w-3 rounded-full bg-moss" title={en.offline.readyDot} aria-label={en.offline.readyDot} role="img" data-testid="offline-dot" />;
  }
  return null;
}
