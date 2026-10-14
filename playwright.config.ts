import { defineConfig } from '@playwright/test';

// End-to-end checks of the real app in a real browser (devpost/spec.md > Stack: Playwright).
// Dev server (5175) for most tests; the built app (4175, `npm run build` first) for offline tests.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:5175',
    viewport: { width: 1280, height: 900 },
    // Most tests are about other things, so "Meet your caveman" counts as already seen; slice 7 resets it.
    storageState: {
      cookies: [],
      origins: ['http://localhost:5175', 'http://localhost:4175'].map((origin) => ({ origin, localStorage: [{ name: 'stoneage.metCaveman', value: '1' }] })),
    },
  },
  webServer: [
    { command: 'npx vite --port 5175 --strictPort', url: 'http://localhost:5175', reuseExistingServer: true, timeout: 60_000, env: { VITE_REPO_URL: 'https://example.invalid/heycaveman' } },
    { command: 'npx vite preview --port 4175 --strictPort', url: 'http://localhost:4175', reuseExistingServer: true, timeout: 60_000 },
  ],
});
