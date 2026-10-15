import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // The voice worker uses ES modules (import.meta), so build workers as modules.
  worker: { format: "es" },
  plugins: [
    react(),
    tailwindcss(),
    // Our own service worker (src/offline/sw.ts); the plugin injects the list of app files to save
    // offline and writes the install manifest (devpost/spec.md > Offline readiness and install (F1)).
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/offline',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      devOptions: { enabled: false },
      injectManifest: {
        // .woff is a fallback older browsers never need offline; woff2 covers every supported browser.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,wav,webmanifest}'],
        // The voice engine (WebAssembly) is saved on first use instead, keeping the first download small.
        globIgnores: ['**/*.woff', 'ort/**', '**/kokoroWorker-*.js'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'HeyCaveman · Stone Age',
        short_name: 'Stone Age',
        description: 'Type a lesson, get a cartoon explainer video. Free, offline, nothing leaves your device.',
        theme_color: '#FBF6EC',
        background_color: '#FBF6EC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { include: ['tests/director/**/*.test.ts', 'tests/storage/**/*.test.ts', 'tests/editor/**/*.test.ts'], environment: 'node' },
});
