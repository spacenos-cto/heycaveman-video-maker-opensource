---
doc: spec
status: approved
---

# HeyCaveman: Stone Age — Technical Spec

## How This Works, In Plain Language
Stone Age is **a website that installs itself into your browser and then never needs the internet again**. There's no server doing work, no database in the cloud and no AI. Everything happens on the teacher's own computer.

The pieces:
1. **The app shell (Vite + React):** the screens, buttons and panels you see. React draws the interface; Vite packages it into plain files any free static host can serve.
2. **The offline helper (a "service worker"):** on the first visit, it quietly saves all of the app's files into the browser. After that, the app opens and works with Wi-Fi off. That's the "Getting ready for offline… 60%" strip.
3. **The director:** a plain TypeScript module, our own code with no AI. It reads the lesson text and decides the scenes: which sentence goes in which scene, which motion and face the caveman makes, which drawings and background appear, which words become the caption, and where a gentle sound plays. It uses word lists and rules, so the same text always gives the same video (Shuffle changes the dice).
4. **The caveman rig:** the caveman is an SVG drawing made of parts (head, body, arms, legs, face) with joints. A motion like "celebrate" is a short list of joint angles over time; a face like "worried" swaps the eyes and mouth. Because every scene draws the same rig from the same saved design, he looks identical everywhere.
5. **The scene renderer (our own code):** each moment of a scene is drawn as one SVG picture: background, drawings, the caveman rig and the caption. On screen, the **player** redraws that picture about 30 times a second. For **Download video**, the very same picture is painted onto a hidden canvas frame by frame, and the browser's built-in video encoder (WebCodecs) turns the frames into an MP4 through **Mediabunny**, a small open-source library. Because the preview and the file are drawn by the same code, "what plays is exactly what exports" holds, and no third-party service is involved.
6. **The voice engine (Kokoro):** a small open-source speech model (~90 MB) that runs in the browser. It's downloaded once and saved; after that it turns each scene's words into speech offline. "Record my voice" uses the microphone instead.
7. **The project store (IndexedDB):** the browser's built-in database on this device. Every change auto-saves there: projects, your caveman, settings, recordings and uploaded pictures. **Save project file** packs a project into one `.caveman` file you can move anywhere.

**Why this shape:** your PRD's promise is "offline, free, nothing leaves the device." A static app with no server is the only shape that can keep that promise, it costs nothing to host, and a school can even run it from a USB stick.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey` (J1, J2).
1. **The teacher opens the site.** The host sends the app files once. React shows the Start screen (`StartScreen`), and in the background the **service worker** saves everything for offline use, reporting progress to the readiness strip (`OfflineStatus`).
2. **They type or paste a lesson** (or tap Try an example). The text auto-saves as a draft in `localStorage` on every keystroke, and the word counter updates live.
3. **They press Make my video.** If no caveman is saved yet, the **Meet your caveman** sheet opens. Their design (or "Cavey") is saved to IndexedDB as **My caveman**.
4. **The director runs** (`director/`): text is cleaned, split into sentences, grouped into scenes, and each scene gets a motion, face, props, background, caption key word, sound effect and duration. The result is a **Project** object, saved to IndexedDB, with a copy of the caveman design inside it.
5. **The player shows it:** our player (`PlayerScreen`) draws the current scene's SVG picture (background → props → caveman rig → captions) about 30 times a second while playing.
6. **Voice (if downloaded):** the voice worker turns each scene's words into a short audio clip with Kokoro, stores it in IndexedDB, and the scene's length becomes the clip's length. The caveman's mouth follows the clip's loudness.
7. **They tap Download video:** the export panel checks the browser can encode video. Then `export/renderMp4.ts` paints every frame of the same scene pictures onto a canvas, mixes the sounds, and Mediabunny packs them into an MP4 (720p or 1080p) with the end card. The browser saves `photosynthesis-heycaveman.mp4`.
8. **J2, offline later:** the service worker serves the app with no network. My videos reads projects back from IndexedDB, and voices come from the browser's saved model files.

```
 typing ─► draft (localStorage)
   │ Make
   ▼
 director ──► Project ──► IndexedDB (auto-save)
                 │
                 ├──► scene SVG ──► our player (preview)
                 ├──► voice worker (Kokoro) ──► audio clips ──► IndexedDB
                 └──► scene SVG ──► canvas ──► Mediabunny ──► MP4 file (Downloads)
```

## Stack
| Piece | Choice | Why | Docs |
|---|---|---|---|
| Language | TypeScript 5.x | Your daily stack | https://www.typescriptlang.org/docs/ |
| UI | React 19 | Your daily stack | https://react.dev |
| Build | Vite 6 | Produces a plain static site; no server needed | https://vite.dev/guide/ |
| Offline | `vite-plugin-pwa` (Workbox) | Generates the service worker and install manifest | https://vite-pwa-org.netlify.app/ |
| Video drawing | Our own SVG scene renderer (`src/video/SceneSvg.tsx`) | **Learner's choice (revision):** Remotion's exporter sends a usage event to its licensing server on every export, which breaks "nothing leaves the device". Our renderer keeps preview and export identical and fully open | — |
| MP4 encoding | `mediabunny` 1.61.4 (MPL-2.0) on the browser's WebCodecs | Canvas frames + audio → MP4, all in the browser, no network | https://mediabunny.dev |
| Voice | `kokoro-js` 1.2.x (Kokoro-82M, q8 ONNX, Apache-2.0) in a Web Worker | Offline neural voices in the browser; ~90 MB once | https://github.com/hexgrad/kokoro/tree/main/kokoro.js |
| State | zustand 5 (plus a small undo/redo history) | Your daily stack | https://zustand.docs.pmnd.rs |
| Styling | Tailwind CSS 4 with the cave-paper colours as theme tokens | Your daily stack | https://tailwindcss.com/docs |
| Storage | IndexedDB via `idb` (small wrapper) | Big files (audio, pictures) on the device | https://github.com/jakearchibald/idb |
| Project file | `fflate` (zip) | Packs a project and its audio and pictures into one `.caveman` file | https://github.com/101arrowz/fflate |
| Fonts | `@fontsource/fredoka`, `@fontsource/atkinson-hyperlegible`, caption font `@fontsource/baloo-2` (ExtraBold) | Bundled, so they work offline; all OFL | https://fontsource.org |
| Tests | Vitest (logic), Playwright (offline journeys) | Your daily stack; Playwright can switch the network off | https://vitest.dev · https://playwright.dev |

- **Foundation:** Vite + React + TypeScript instead of Next.js. *Recommended by the agent* (no server is wanted); confirm at review.
- **Caption font:** Baloo 2 ExtraBold. *Recommended by the agent* to settle the PRD's open question; heavy, rounded, readable from the back of a room. Confirm or swap at review.
- **Verify early (slice 1):**
  1. That a canvas painted from SVG frames encodes to an H.264 + AAC MP4 with audio in sync.
  2. Output codecs (H.264 + AAC preferred).
  3. Chromebook speed for a 1-minute 720p export.

## Where It Runs and How Someone Tries It
- **Runtime:** the browser only. Chrome or Edge (latest two) for the full experience; Firefox and Safari desktop as "should work". No API keys, no accounts, no environment variables.
- **Develop:** `npm install` then `npm run dev`, and open http://localhost:5173.
- **Test the real offline build:** `npm run build` then `npm run preview`, and open http://localhost:4173. Wait for "✓ Works offline", turn Wi-Fi off, reload, and make and export a video.
- **Demo recording (`6-ship`):**
  1. Open the preview build and paste a lesson; Make; meet the caveman; play.
  2. Tap a scene and change it.
  3. Switch Wi-Fi off live, export the MP4, and play the file.
- **Submission:** a public GitHub repo with the `LICENSE` (AGPL-3.0, unmodified text so GitHub detects it in About), the art and sounds under CC0 (`assets/LICENSE-ASSETS.md`), the planning docs `devpost/scope.md`, `prd.md` and `spec.md` committed (`learner-profile.md` stays ignored), the README's "Pre-existing work and AI assistance" section, and a YouTube or Vimeo video showing the real app end to end.
- **Optional deployment (learner's PRD: official home stoneage.heycaveman.com):** any free static host (Cloudflare Pages, Netlify or GitHub Pages) serving `dist/`. The deploy is `npm run build` plus uploading `dist/`. It's not required for submission; decide in `6-ship`.

## Look and Feel
Implements `prd.md > Look and Feel`; nothing re-decided here.
- **Theme tokens** (Tailwind `@theme`): `cave-paper #FBF6EC`, `bone #FFFFFF`, `sand #F1E8D6`, `charcoal #1F1A17`, `ash #6B5F55`, `ochre #E8892B`, `terracotta #B8482A`, `moss #4F7A3A`, `river #3D7FC4`, `berry #B23A48`, `hairline #E3D8C4`.
  - **Night cave theme:** the same tokens with the PRD's dark values, switched by `data-theme` on `<html>`.
  - **Theme choice:** Light, Dark, or Match my device (`prefers-color-scheme`).
- **Type:** Fredoka SemiBold/Bold for headlines, buttons, tabs and card titles; Atkinson Hyperlegible for body text and inputs. The base is `17px`; headlines are 40–48 px on desktop and 30 px on phones.
- **Pressable things:** a shared `Button`, `Chip` and `ChoiceCard` with a 2 px charcoal outline and a 3 px solid sticker shadow (`box-shadow: 3px 3px 0 charcoal`). On `:active`, they translate 3 px into the shadow. Radius is 12 px for buttons, 14 px for cards, full for chips. Selected items get an ochre outline plus a ✓ badge.
- **Containers:** a white surface, a hairline border and a soft shadow; no heavy outline.
- **Icons:** one rounded 2 px line set (Lucide, ISC licence), charcoal, always with a text label in the toolbar.
- **Motion:** 150–200 ms ease-out; `prefers-reduced-motion` turns them into fades. Only the caveman loops.
- **Paper grain:** a tiny bundled PNG texture on `body`, off in dark mode and with reduced motion or high contrast.
- **Copy:** all interface strings live in `src/i18n/en.ts` (translatable later; PRD > Language). Tone follows the PRD: plain, warm, short, light caveman humour only where nothing's at stake, never caveman-speak.
- **Inside the video:**
  - **Colour moods:** Bright, Earthy and Soft live in `src/video/moods.ts` as data; the PRD's hex values are copied exactly.
  - **Caption contrast:** checked by `contrast.ts`, which requires ≥ 7:1 effective.
  - **Caption size:** a minimum of 6% of the short edge.
  - **Backgrounds:** no pure white; neighbouring scenes never repeat a background colour.

## Components

### App shell and navigation
- **What it does:** `App.tsx` holds the header (logo, `OfflineStatus`, My videos, Install app, ⋯ menu) and switches between screens with a tiny in-app router: `start`, `making`, `player`, `editor`, `videos`, `settings`, `help`, `about`. There are no URL routes, except `?classroom` (Classroom mode) and `#project=<id>` so a reload returns to the open project.
- **PRD ref:** `prd.md > Screens and Layout`.

### Offline readiness and install (F1)
- **Service worker:** `vite-plugin-pwa` precaches the built app, fonts, the asset library and sounds, and reports progress through a small message channel to `OfflineStatus` (the strip, the dot and the Offline pill).
- **Updates:** use the "prompt" mode. It shows "A new version is ready — Reload" and never auto-reloads; it saves first.
- **Install:** `beforeinstallprompt` drives the Install app button.
- **Storage checks:** `navigator.storage.estimate()` drives the low-space banner. A failing IndexedDB open, or a failing `navigator.storage.persist()`, triggers the storage-blocked banner.
- **PRD ref:** `prd.md > F1 — App load & offline readiness`.

### Start screen (F2)
- **Layout:** the tabs Write it, Start from a topic and Use a template; the text box with a live counter (words, and seconds at 150 words per minute); Try an example; the shape cards; Make my video; the small-print row.
- **Draft:** auto-saved to `localStorage` key `stoneage.draft`.
- **Input rules:**
  - The topic-only check (≤ 4 words and no sentence punctuation) switches to the Lesson Builder.
  - Link detection goes to F3.4.
  - The length limits are 1,500 words (orange warning) and 3,000 words (hard stop).
  - Text cleaning (bullets to sentences, emoji rules) runs in `director/clean.ts`.
- **PRD ref:** `prd.md > F2 — The Start screen (first screen)`.

### Lesson Builder and templates (F3)
- **`LessonBuilder`:** a form whose fields map 1:1 to the PRD table. `buildScript(fields)` in `director/lessonBuilder.ts` outputs text in the order hook → points → example → recap → quiz → outro, plus structured quiz data.
- **Templates:** the 6 templates are data in `src/data/templates.ts`, with fields and grey examples.
- **Links:** `LinkCard` handles pasted links (F3.4).
- **PRD ref:** `prd.md > F3 — Lesson input`.

### Meet your caveman (F4)
- **`CavemanSheet`:** presets (Cavey, Teacher, Student, Storyteller) and the Customise options, with a live `CavemanRig` preview that waves on change.
- **Where it's saved:** to `settings.myCaveman`. Each project stores its own copy in `project.caveman`.
- **Changing it inside a project:** asks "Just this video, or make this my caveman for new videos too?"
- **Locked styles:** Countryball and Blob cards come from `src/data/premium.ts`; they're hidden in Classroom mode.
- **PRD ref:** `prd.md > F4 — Meet your caveman (character setup)`.

### The caveman rig
- **Drawing:** the caveman is a React SVG component, `CavemanRig({ design, motion, expression, frame, mouthOpen, blink })`.
- **Rig data:**
  - A skeleton of named joints (neck, shoulders, elbows, hips, knees) with lengths scaled by `headSize`.
  - **Motions:** the 16 motions are keyframe tables in `src/caveman/motions.ts` (joint angles at keyframes, eased between).
  - **Expressions:** the 6 are eye, brow and mouth variants in `expressions.ts`.
  - **Two styles:** Classic (stick lines) and Cartoon (filled shapes, clothes, hair, glasses, facial hair).
  - **Blink:** a deterministic timer seeded by the scene id.
  - **Lip-sync:** `mouthOpen` comes from the voice clip's precomputed loudness envelope (one value per video frame), or from a gentle "talk" cycle when there's no voice.
- **This is the kernel:** identical in every scene because the same design object feeds the same rig code.
- **PRD ref:** `prd.md > F4`, `prd.md > F6` (Caveman acting), `scope.md > The Unique Kernel`.

### The director (F6)
- **Pure TypeScript,** with no React and no I/O, so it's fully unit-testable. `direct(text, { seed, shape, mood, readingSpeed, voiceDurations? }) → Scene[]`.
- **Pipeline:**
  1. `clean.ts`: normalize whitespace, turn bullets into sentences, strip links (noting it), handle emoji.
  2. `split.ts`: split into sentences (a rule-based splitter that respects "Dr.", "e.g.", decimals). Blank lines force scene breaks.
  3. `group.ts`: roughly one idea per scene. Sentences under 5 words join a neighbour; sentences over 28 words split at a comma or conjunction.
  4. `act.ts`: a rule table picks the motion and expression from cue words. A question becomes think or shrug; but, wrong or not becomes disagree; great or yay becomes celebrate; numbers or steps become explain or point; scared or danger becomes scared; and so on. The first match wins, otherwise talk. Neighbouring scenes vary.
  5. `props.ts`: words are stemmed and matched against the asset manifest's names, tags and synonyms (`assets/manifest.json`). Up to 2 props per scene, ranked by tag-match strength.
  6. `setting.ts`: a background setting is detected from place words ("kitchen", "space", "classroom") and kept until a new place appears. Otherwise it's a mood colour, never repeated in neighbouring scenes.
  7. `caption.ts`: key words come from the sentence minus stop-words, keeping nouns, numbers and terms (max ~5 words). The key word is highlighted. Numbers and equations become word-art (for example, `CO2` becomes `CO₂`).
  8. `sfx.ts`: a pop when a prop appears, a whoosh on a scene change, a ding when a sentence has a key-fact cue. At most one per scene in Gentle mode.
  9. `timing.ts`: the voice duration if known, else reading time at the chosen speed (slow 110, normal 150, fast 190 words per minute; minimum 2.5 s).
  10. `structure.ts`: a title card first, quiz and recap scenes from Lesson Builder data, and the end card last (export only, F13).
- **Determinism:** a seeded random generator (`seed = hash(text)`), so the same text always gives the same video. Shuffle sets a new seed and re-runs `act` and `props` only.
- **PRD ref:** `prd.md > F6 — Make (the offline director)`, `prd.md > F12 — Education extras`.

### Making progress screen (F6)
- **What it does:** shows the stone-wheel caveman and the step list, and runs the director (and voices, if ready) inside `requestIdleCallback` chunks so the UI never freezes.
- **Cancel:** aborts and returns to Start with the text untouched.
- **Errors:** "The caveman tripped…" with a Show details link.
- **PRD ref:** `prd.md > F6`.

### Video scene renderer (SVG)
- **Structure:** `src/video/SceneSvg.tsx` draws one scene at one frame as a single `<svg>`: background (colour or setting drawing), props (pop-in and float), the `CavemanRig`, and captions as SVG text with an outline. `src/video/timeline.ts` maps a frame to its scene and local frame. Animation helpers (`spring`) are small pure functions of the frame number.
- **Size:** shape presets set the size and layout: Wide 1920×1080 / 1280×720, Tall 1080×1920, Square 1080×1080. Tall puts the caveman bigger and centred with phone-safe margins.
- **Single source:** the same `SceneSvg` feeds the player, the thumbnails and the MP4 export. For export, drawings and the caption font are embedded as data URIs so the SVG paints on a canvas with no network.
- **PRD ref:** `prd.md > F5 — Video shape`, `prd.md > F7`, `prd.md > Look and Feel > Inside the video`.

### Player (F7)
- **What it does:** our own player: a frame clock (requestAnimationFrame) draws `SceneSvg` for the current frame, with play/pause, a scrub bar with scene markers, scene thumbnails (static `SceneSvg`), full screen, and keyboard (Space, ←/→). Sound effects play through Web Audio, scheduled at scene starts.
- **Toolbar:** shape, Colour mood, Shuffle, Voice, Edit, Download video, Save.
- **Pause points:** Classroom pause points stop playback at the end of a marked scene in the Player only.
- **PRD ref:** `prd.md > F7 — Watch (the player)`.

### Scene panel and undo (F8)
- **`ScenePanel`:** edits one scene's words (marking its voice as out of date), caption and style, motion and face chips (animated mini rigs), background, props, sound, and duplicate/delete/move/add-after.
- **Undo/redo:** an undo history of ≥ 50 project snapshots, using immutable updates in zustand plus a history stack. Ctrl+Z and Ctrl+Y work.
- **PRD ref:** `prd.md > F8 — Quick scene edits (tap a scene)`.

### Editor (F9)
- **`Editor`:** a scene list with drag-to-reorder and durations; the `Stage` with drag, resize and rotate handles and snap guides (plain pointer events on an SVG overlay, positions stored as percentages of the frame, so shapes survive switching); a prop library (search over manifest names and tags); multiple captions per scene with start and end; character; upload.
- **Uploads:** pictures are resized with a canvas to ≤ 1920 px, stored as blobs in IndexedDB, with a 5 MB limit and the PRD's messages.
- **PRD ref:** `prd.md > F9 — Editor (more control)`.

### Voice (F10)
- **Built-in voices:** `voice/kokoroWorker.ts` runs kokoro-js (q8, WASM; WebGPU when available) off the main thread.
  - **Download:** the model downloads once through the library's browser cache (Cache Storage), with progress and resume.
  - **Clips:** each scene clip is stored as WAV in IndexedDB, with its loudness envelope.
  - **Device check:** the capability check needs WebAssembly SIMD and at least 4 GB `deviceMemory` when reported; otherwise it says "Not available on this device".
- **Record my voice:** `MediaRecorder` with `getUserMedia({ audio: true })`, only after Record is pressed. It shows a teleprompter, a 3-2-1 countdown, and a level meter (`AnalyserNode`). It checks for silence by RMS before Keep, and stops automatically at 60 s.
- **Voice state per scene:** `builtin`, `recorded` or `none`, plus a `stale` flag when the words change.
- **Not offered:** the device's own speech voices (PRD Non-Goals).
- **PRD ref:** `prd.md > F10 — Voice`.

### Sound effects (F11)
- **Library:** 10 bundled CC0 effects in `public/sfx/` (pop, whoosh, ding and others).
- **Levels:** On, Gentle or Off is a project setting the director and composition both read. Gentle limits each scene to one effect and lowers their volume relative to the voice.
- **PRD ref:** `prd.md > F11 — Sound effects`.

### Education extras (F12)
- **Scene types:** title, quiz (question, Think… countdown, reveal, optional multiple choice), recap and end card are scene types in the composition.
- **Key-word highlight:** done in `caption.ts`.
- **Pause points:** a scene flag (the export instead holds the scene 3 s longer).
- **Reading speed:** feeds `timing.ts` and the voice rate.
- **PRD ref:** `prd.md > F12 — Education extras`.

### Export (F13)
- **`ExportPanel`:**
  - Choose quality (720p or 1080p) and the end card.
  - **Capability check:** `VideoEncoder` exists, and `VideoEncoder.isConfigSupported` passes for H.264 at the chosen size. If not, it explains before starting.
  - **Render:** `export/renderMp4.ts` paints each frame (`SceneSvg` → SVG image → canvas) and encodes H.264 video through Mediabunny's `CanvasSource`, with progress, time left and Cancel.
  - **Hidden tab:** it pauses and resumes on `visibilitychange`.
  - **Out of memory:** a caught error shows "too long for this device".
  - **Done:** the file downloads as `<slug>-heycaveman.mp4`.
- **Audio:** `export/audioMix.ts` mixes the sound effects (and later voices) with an `OfflineAudioContext` into one buffer, encoded as AAC through Mediabunny's `AudioBufferSource` in the same MP4.
- **PRD ref:** `prd.md > F13 — Download video (export)`.

### My videos and files (F14)
- **`VideosPage`:** project cards (a thumbnail rendered from the first scene) with Open, Rename, Duplicate, Save as file, Delete, Recently deleted (purged after 30 days on app open), New video, Open a file, and a storage meter.
- **Auto-save:** debounced (300 ms) after every change.
- **Two tabs:** detected with `BroadcastChannel`; the second tab becomes read-only.
- **The `.caveman` file:** a zip of `project.json` (with `formatVersion`) plus `audio/*` and `images/*`. **Unknown fields are kept untouched** when opening and saving, so premium files survive (PRD > Product Decisions: "Same file, bigger world").
- **PRD ref:** `prd.md > F14 — My videos (saving & files)`.

### Premium bridge (F15)
- **Mentions:** all premium mentions come from one module, `src/data/premium.ts`. Each one checks `settings.classroomMode` and `settings.dismissed[id]`.
- **Handoff:** Open in HeyCaveman saves the `.caveman` file, then opens `https://heycaveman.com/import?from=stoneage` in a new tab with the launch discount code shown. The person drops the file in. There is no automatic network transfer, which keeps "nothing leaves the device" true.
- **PRD ref:** `prd.md > F15 — The bridge to HeyCaveman (premium)`.

### Settings, help and about (F16)
- **Settings** are one object in IndexedDB: Classroom mode (also set by `?classroom`), defaults, appearance, My caveman, storage (delete voices clears the model cache; delete all double-confirms).
- **Help:** a short page using the real rig.
- **About:** version, licences and credits.
- **Report a problem:** opens a pre-filled GitHub "new issue" URL only when clicked, showing the text first.
- **PRD ref:** `prd.md > F16 — Settings, help & about`.

## Data Model
All on the device. Nothing is on a server.

```ts
type Project = {
  id: string; formatVersion: 1; title: string;
  shape: 'wide' | 'tall' | 'square'; mood: 'bright' | 'earthy' | 'soft';
  caveman: CavemanDesign;            // this project's own copy
  scenes: Scene[]; seed: number;
  voiceMode: 'builtin' | 'recorded' | 'none'; voiceId?: string;
  sfxLevel: 'on' | 'gentle' | 'off'; readingSpeed: 'slow' | 'normal' | 'fast';
  endCard: boolean; sourceText: string; lesson?: LessonFields;
  createdAt: number; updatedAt: number; deletedAt?: number;
  extra?: Record<string, unknown>;    // unknown/premium fields, kept untouched
};
type Scene = {
  id: string; kind: 'title' | 'line' | 'quiz' | 'recap' | 'end';
  words: string; captions: Caption[];
  motion: MotionId; expression: ExpressionId; hideCaveman?: boolean;
  background: { type: 'color'; color: string; manual?: boolean }
            | { type: 'setting'; assetId: string } | { type: 'upload'; blobId: string };
  props: PropPlacement[];             // x, y, scale, rotation as % of frame; in/out times
  sfx?: SfxId; durationMs: number; pauseHere?: boolean;
  voice: { type: 'builtin' | 'recorded' | 'none'; blobId?: string; envelope?: number[]; stale?: boolean };
  quiz?: { question: string; answer?: string; options?: string[]; correct?: number; thinkSeconds: number };
};
type CavemanDesign = { style: 'classic' | 'cartoon' | string; skin: string; clothes?: string;
  clothesColor?: string; trousersColor?: string; hair?: string; hairColor?: string;
  glasses?: string; facialHair?: string; headSize: number; name?: string };
type Settings = { myCaveman?: CavemanDesign; classroomMode: boolean; theme: 'light' | 'dark' | 'system';
  defaults: { shape; mood; voiceMode; voiceSpeed; sfxLevel; endCard; readingSpeed };
  dismissed: Record<string, true>; seenTips: Record<string, true> };
```

| Data | Where it lives | How it updates | When you leave and come back |
|---|---|---|---|
| Draft text | `localStorage` `stoneage.draft` | Every keystroke | Restored in the text box |
| Projects | IndexedDB store `projects` | Auto-save 300 ms after any change | Listed in My videos; the last one is offered as "Continue" |
| Audio clips, uploaded pictures | IndexedDB store `blobs` | On voice generation, recording or upload | Still there; also inside `.caveman` files |
| My caveman, settings | IndexedDB store `settings` | On save | Still there |
| Voice model (~90 MB) | Browser Cache Storage (through the library) | One-time download | Still there until Delete voices |
| App files | Service worker cache | First visit, and app updates | Offline-ready |
| Asset library and sounds | Bundled in the app (`public/assets`, `public/sfx`) and precached | App updates only | Always available |

If storage is blocked, the same objects live in memory for the session only, and the banner and Save project file appear (PRD > F1, F14).

## File Structure
```
app/
├── public/
│   ├── assets/              # SVG drawings copied from stickmotion (CC0, disclosed); props + bg-* settings
│   ├── sfx/                 # 10 CC0 sound effects
│   ├── icons/               # PWA icons + logo
│   └── textures/paper.png   # faint paper grain
├── assets/
│   ├── manifest.json        # every drawing: id, file, names, tags, synonyms, category, kidSafeReviewed
│   └── LICENSE-ASSETS.md    # CC0 dedication + provenance (AI-assisted, from the learner's stickmotion project)
├── src/
│   ├── main.tsx · App.tsx   # entry, header, screen switch
│   ├── i18n/en.ts           # every interface string
│   ├── styles/theme.css     # Tailwind @theme tokens, fonts, sticker buttons
│   ├── ui/                  # Button, Chip, ChoiceCard, Sheet, Banner, Toast, icons
│   ├── screens/             # StartScreen, LessonBuilder, Templates, CavemanSheet, Making,
│   │                        # PlayerScreen, ScenePanel, Editor/, ExportPanel, VideosPage, Settings, Help, About
│   ├── director/            # clean, split, group, act, props, setting, caption, sfx, timing,
│   │                        # structure, lessonBuilder, random (seeded), index (direct())
│   ├── caveman/             # CavemanRig.tsx, skeleton, motions, expressions, presets
│   ├── video/               # SceneSvg.tsx (one scene at one frame), timeline.ts, spring.ts, moods.ts, contrast.ts
│   ├── voice/               # kokoroWorker.ts, voiceClient.ts, recorder.ts, envelope.ts
│   ├── export/              # capability.ts, renderMp4.ts, audioMix.ts (fallback)
│   ├── store/               # zustand stores (project, ui, settings), history (undo), autosave
│   ├── storage/             # db.ts (IndexedDB via idb), projectFile.ts (.caveman zip), quota.ts, tabs.ts
│   ├── offline/             # sw registration, readiness progress, install prompt
│   └── data/                # templates.ts, examples.ts, premium.ts, motions list
├── tests/
│   ├── director/            # golden tests: each template example → expected scene plan
│   ├── storage/             # file round-trip, unknown fields preserved
│   └── e2e/                 # Playwright: first visit, offline reload, make, edit, export
├── devpost/                 # Devpost learning workspace
├── LICENSE                  # AGPL-3.0 (unmodified text)
├── scripts/check-public.mjs # pre-commit scan: secrets, local paths, emails, private keywords
├── README.md                # run, offline test, asset disclosure
├── index.html · vite.config.ts · tailwind/postcss config · tsconfig.json · package.json
```

## External Services and Dependencies
There are **no runtime services.** The app makes no network calls after the first load, except the one-time voice model download and the learner-initiated links (Report a problem, Open in HeyCaveman).
- **Voice model download:** `kokoro-js` fetches `onnx-community/Kokoro-82M-v1.0-ONNX` (q8) from the Hugging Face CDN on first use. It's free, needs no key, and the weights are Apache-2.0. Docs: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
  - **The only external request in the app.** Shown with its size before downloading. PRD principle 2 lists it as the documented exception.
  - **Self-hosting:** schools can host the model files themselves through a config value, `VOICE_MODEL_BASE`.
- **No video service or tracking library:** Remotion was dropped during the build because its exporter reports every render to its licensing server. The app has no analytics or usage pings of any kind.
- **Hosting (optional):** any free static host serving `dist/`.

## Important Failure Modes
- **The browser can't encode video** (no WebCodecs or H.264) → the export button explains before starting, with "Use Chrome or Edge, or save the project file" (F13).
- **The voice download is blocked or fails** (school networks) → "Couldn't download voices…" with Record my voice suggested. No retry loop; captions and effects still play (F10).
- **IndexedDB is blocked** (private window or school policy) → the session runs in memory, with the yellow banner and Save project file prominent (F1).
- **A long video runs out of memory during export** → export stops cleanly with "too long for this device", and the project stays untouched (F13).
- **The director finds no matching drawing** → caption-led scene with a mood colour, never empty (F6).

## What Was Simplified and Why
- **The premium handoff is a saved file plus opening heycaveman.com/import** instead of an automatic browser-to-site transfer. A direct transfer would need network messaging between sites, while this keeps "nothing leaves the device" true. *Implementation detail derived from the PRD; confirm at review.*
- **Lip-sync from loudness** instead of matching mouth shapes to sounds. Loudness-driven mouth open/close reads well on a doodle caveman and needs no extra model; phoneme lip-sync would need phoneme timings from the voice engine. *Implementation detail; confirm at review.*

## Decisions and Open Issues

### Learner decisions (this spec)
- **Rendering and MP4 export use our own SVG renderer plus Mediabunny** (revision during slice 2; originally Remotion). *Why:* `@remotion/web-renderer` sends a usage event (site address, success) to remotion.pro on every export, even with the free licence, which breaks the PRD's "nothing leaves the device" and "zero requests to other domains". *Tradeoff accepted:* about one extra slice of work. In return, the preview and export stay identical and the whole stack is OSI open source.
- **Assets are copied from the learner's stickmotion project** (the SVG drawings, and sound effects if suitable ones exist there). They were AI-generated with Claude on the learner's account and are released here as CC0. *Must be disclosed* in the Devpost submission as pre-existing, AI-assisted assets; no stickmotion code is copied.
- **Spell out the three unknowns** (below) in the spec, to serve the learning goal of specifying every feature before building.
- **Licence: AGPL-3.0** (unmodified text, so GitHub detects it). The Remotion exception is no longer needed now that Remotion is gone. Art and sounds are CC0 (`assets/LICENSE-ASSETS.md`).
- **Disclosure of pre-existing work** (hackathon rule: "must disclose any other pre-existing code or work incorporated"). The SVG drawings (and any sounds) are copied from the learner's earlier HeyCaveman work. They were AI-assisted and created Oct 5–13 2026, inside the submission period. **No earlier code is reused.** This is stated in three places: the Devpost text description (written by the learner), the README's "Pre-existing work and AI assistance" section, and `assets/LICENSE-ASSETS.md`.
- **Business details kept generic in public docs:** "a launch discount code" instead of the actual code, and no revenue targets (learner delegated this; it doesn't affect eligibility).
- **Public-safety check:** `npm run check:public` scans staged files before every commit. It looks for key and token patterns, private-key headers, absolute local paths, email addresses and a private keyword list. The keyword list lives in a gitignored `.check-public.local`, so the list itself is never published. `6-ship` re-runs it over the full git history before the repo goes public.

### Agent recommendations awaiting the learner's confirmation at review
- Vite + React + TypeScript static PWA (no Next.js).
- Caption font: Baloo 2 ExtraBold.
- The two simplifications above.

### The learner's unknowns, made explicit
1. **How the offline director picks poses and props from words.**
   - **How it works:** it's a rule book plus a word index, no AI. Each drawing has names, tags and synonyms in `manifest.json` ("plant": leaf, flower, grow, photosynthesis). Each sentence's words are simplified to their root ("leaves" → "leaf") and looked up. The best one or two matches appear as props.
   - **Motions:** chosen by cue words in a ranked rule list ("?" → think, "but/wrong" → disagree, "yay/great" → celebrate, "first/then/step" → explain).
   - **Determinism:** the same sentence always gives the same choice, because a "dice" seeded from the text breaks ties.
   - **How we'll know:** golden tests run every template example and check each scene's plan. The ≥ 70% relevant-prop check (PRD F6) is measured by a script counting scenes with a tag match.
2. **How MP4 export works in the browser.**
   - **How it works:** our exporter steps through every frame, draws the same SVG scene picture the player shows onto a hidden canvas, and hands each canvas frame to the browser's built-in video encoder (WebCodecs). The sounds are mixed into one audio track, and Mediabunny packs video and audio into an MP4 that the browser downloads. No server is involved.
   - **To verify in build slice 2** (a small investigation):
     1. Render a 10 s, 2-scene test with voice and a sound effect.
     2. Confirm the MP4 has audio in sync and plays in VLC and Windows Photos.
     3. Time a 1-minute 720p export.
     4. If audio is missing, switch to the audio-mix fallback.
3. **How offline voices work.**
   - **How it works:** Kokoro is a small speech model (82 million parameters; ~90 MB in q8) that runs inside the browser using WebAssembly (or the GPU through WebGPU). It's downloaded once and saved in the browser's cache, then used with no internet, in a background worker so typing never freezes.
   - **To verify early in M3:**
     1. Download size and time.
     2. Seconds per scene on a 4 GB machine.
     3. The voice list. Kokoro-js appears to be English-only (US/UK); if there's no Hindi-English voice, the PRD's "when available" stays honest by not offering one.

### Open issues
- **Sound effects source:** are 10 suitable sound effects in stickmotion? `media/audio` holds 228 WAV files with hashed names, which look like generated voices. If there aren't any, make 10 gentle effects with a small script (Web Audio synthesis, rendered to WAV) as fresh CC0 work. *Must be decided before M2;* doesn't block M1.
- **Asset kid-safety and tagging:** copied drawings need a kid-safe review and tags/synonyms in `manifest.json` (PRD > Privacy and child safety). About 112 SVGs exist versus the PRD's ~280 target. *Can wait:* M1 ships with the reviewed subset, and the library grows in M4.
- **MP4 audio and codecs (our exporter):** verified in slice 2 by probing the exported file.
- **Kokoro voice list and speed on Chromebooks:** unverified, checked early in M3.
- **Premium import page** (`heycaveman.com/import`) must exist for M5's handoff. Carried over from `prd.md > Open Questions`; M5 is last.
- **Self-review notes:**
  1. Every PRD feature F1–F16 and Look and Feel has a component heading above.
  2. The data model, file tree and components match.
  3. The service worker must also precache the asset library and sounds (≈ 22 MB in stickmotion's `public/`). This may exceed the PRD's 15 MB first-download budget, so measure in M1 and trim or compress SVGs if needed.
