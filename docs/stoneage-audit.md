# Stone Age audit (Oct 22 2026)

Written before any change for the finish-to-submit PRD. Requirement IDs (SHIP, PLAYER, MATCH, NAV, BRAND, CLUTTER) come from that PRD. Paths are relative to `app/`.

## How the app is put together

- **Screens.** No router. `src/store/app.ts` keeps `screen` (`start | making | player | editor | videos | settings | help | about`); `src/App.tsx` switches on it.
- **URL.** Only `#project=<id>` (set by `setProject`, read once on load in `App.tsx`) and `?classroom` (`store/settings.ts`).
- **Back.** `go()` only calls `history.replaceState`, so the browser Back button leaves the app. Every back is an in-app button.
- **Panels.** Player: `ScenePanel` (side `aside`), `ExportPanel`, `VoicePanel` and the HeyCaveman handoff are fixed dialogs. Editor: `editor/EditorScreen.tsx` with `Library` and `Stage`.
- **Theme.** Tokens in `src/styles/theme.css` (`@theme`, Night overrides near the end, many as class patches). Appearance lives on Settings (`screens/InfoPages.tsx`), saved in IndexedDB (`settings` key `app`), applied as `html[data-theme]` in `App.tsx`.
- **State.** zustand: `store/app.ts`, `store/settings.ts`, `voice/voiceStore.ts`, `offline/status.ts`. IndexedDB `stoneage` (projects, blobs, settings). localStorage: `stoneage.draft`, `stoneage.lesson`, `stoneage.metCaveman`.
- **Director.** `src/director/` (pure, seeded). Drawing choice: `props.ts` + `words.ts`; drawings and tags in `public/assets/` + `assets/manifest.json`.
- **Premium mentions.** All in `src/data/premium.ts`; `LAUNCH_CODE` shown in the Player handoff and on About.
- **Notifications.** None sent. Status banners in `ui/StatusBanners.tsx`; the one-time "saved in this browser" note comes from `firstSaveNotice` in `store/app.ts`.

## What's broken or weak

1. Player at 1440×900: the video fills the first screen; Play, Download and scenes sit below the fold among ~16 controls (`screens/PlayerScreen.tsx:180-311`).
2. Two filled buttons on the Player (Play, Download); Voice and Save project file are loose buttons; the voice card and premium note are full-width rows.
3. Drawings: equal scores tie-break by manifest order, plurals score as prefixes, and the no-repeat rule drops the lesson's own drawing (`director/props.ts`, `director/words.ts`).
4. Browser Back leaves the app (`store/app.ts` `go`).
5. Player and Editor call `go('start')` during render when no project is loaded (`PlayerScreen.tsx:169`, `EditorScreen.tsx:103`).
6. Old accents: slider `accent-[#E8892B]`, dialog backdrop `rgb(31 26 23)`, warnings use `text-ochre` (black).
7. Logo, PWA icons and manifest colours (`#FBF6EC`) still use the first, earthy palette.
8. `STONEAGE` launch code is a placeholder that is shown to users.
9. No live deployment config; README only has clone steps.

## Requirement → files

| ID | Files |
| --- | --- |
| SHIP-1 | new Cloudflare Pages settings (no repo file needed; build `npm run build`, output `dist`), `README.md` |
| SHIP-2 | `devpost/checklist.md`, `devpost/app-map.html` (new) |
| SHIP-3 | `README.md`, `assets/LICENSE-ASSETS.md` |
| PLAYER-1..3 | `screens/PlayerScreen.tsx`, `screens/ScenePanel.tsx`, `ui/StatusBanners.tsx`, `i18n/en.ts` |
| PLAYER-4 | `data/premium.ts`, `screens/PlayerScreen.tsx`, `screens/InfoPages.tsx` |
| MATCH-1..2 | `director/props.ts`, `director/words.ts`, `tests/director/` (new test) |
| MATCH-3 | `public/assets/*.svg`, `assets/manifest.json`, `assets/LICENSE-ASSETS.md` |
| NAV-1 | `store/app.ts`, `App.tsx`, `screens/MakingScreen.tsx` |
| NAV-2 | `screens/PlayerScreen.tsx`, `editor/EditorScreen.tsx` |
| BRAND-1..2 | `public/icons/logo.svg`, `ui/Logo.tsx`, `scripts/make-icons.mjs`, `vite.config.ts` |
| BRAND-3..4 | `styles/theme.css`, components using `#000`/`#fff`/`text-ochre` |
| CLUTTER-1 | `screens/StartScreen.tsx`, `ui/HeroCaveman.tsx` |
| CLUTTER-2 | `screens/VideosPage.tsx` |

## Things that must keep working

`#project=` reload, `?classroom`, offline service worker, `.caveman` files, MP4 export, voices and recording, undo/redo, multi-tab read-only lock, all Vitest and Playwright specs.

## Proposals only (not built without approval)

- Lesson Builder: fold optional fields (example, recap) under "More".
- Settings / Help / About: merge into one page with three sections.
