// Two tabs editing the same project would overwrite each other. The tab that opened it second becomes
// read-only ("Open in another tab") until reloaded (devpost/prd.md > F14 edge case 4).
const TAB_ID = Math.random().toString(36).slice(2);
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('stoneage-tabs');
let openProjectId: string | null = null;

channel?.addEventListener('message', (e) => {
  const m = e.data as { type: string; id: string; from: string };
  if (m.type === 'hello' && m.id === openProjectId && m.from !== TAB_ID) channel.postMessage({ type: 'mine', id: m.id, from: TAB_ID });
});

/** Announce that this tab opened a project. Resolves true if another tab already has it open. */
export function claimProject(id: string): Promise<boolean> {
  openProjectId = id;
  if (!channel) return Promise.resolve(false);
  return new Promise((resolve) => {
    const onMessage = (e: MessageEvent) => {
      const m = e.data as { type: string; id: string; from: string };
      if (m.type === 'mine' && m.id === id && m.from !== TAB_ID) {
        channel.removeEventListener('message', onMessage);
        resolve(true);
      }
    };
    channel.addEventListener('message', onMessage);
    channel.postMessage({ type: 'hello', id, from: TAB_ID });
    setTimeout(() => {
      channel.removeEventListener('message', onMessage);
      resolve(false);
    }, 250);
  });
}

export function releaseProject() {
  openProjectId = null;
}
