/// <reference lib="webworker" />
// The offline helper (devpost/prd.md > F1). On first visit it saves every app file into the browser,
// telling the page how far along it is ("Getting ready for offline… 60%"). After that the app opens
// and works with the network unplugged. An interrupted save resumes next visit (files already saved
// are skipped). Updates wait until the page says it's safe to reload.
export {};
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: { url: string; revision: string | null }[] };

const CACHE = 'stoneage-app-v1';
const ENTRIES = self.__WB_MANIFEST;
const urlOf = (u: string) => new URL(u, self.location.origin).href;

async function broadcast(message: unknown) {
  const all = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of all) c.postMessage(message);
}

/** A key that changes when a file's content changes, so updates replace stale files. */
const keyOf = (e: { url: string; revision: string | null }) => (e.revision ? `${urlOf(e.url)}?__rev=${e.revision}` : urlOf(e.url));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      let done = 0;
      const total = ENTRIES.length;
      for (const entry of ENTRIES) {
        const key = keyOf(entry);
        if (!(await cache.match(key))) {
          const res = await fetch(urlOf(entry.url), { cache: 'reload' });
          if (!res.ok) throw new Error(`offline save failed for ${entry.url}`);
          await cache.put(key, res);
        }
        done++;
        if (done % 3 === 0 || done === total) await broadcast({ type: 'sw-progress', done, total });
      }
      // First install: take over straight away so the very first visit becomes offline-ready.
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set(ENTRIES.map(keyOf));
      const cache = await caches.open(CACHE);
      for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
      await self.clients.claim();
      await broadcast({ type: 'sw-ready' });
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

const byUrl = new Map(ENTRIES.map((e) => [urlOf(e.url), keyOf(e)]));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (req.mode === 'navigate') {
        // Any page of the app opens the app shell, online or not.
        const shell = byUrl.get(urlOf('index.html'));
        try {
          return await fetch(req);
        } catch {
          const cached = shell && (await cache.match(shell));
          if (cached) return cached;
          throw new Error('offline and not saved yet');
        }
      }
      const url = new URL(req.url);
      const key = byUrl.get(url.origin + url.pathname);
      const cached = key ? await cache.match(key) : undefined;
      return cached ?? fetch(req);
    })(),
  );
});
