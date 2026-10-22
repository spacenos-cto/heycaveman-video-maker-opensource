---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Type a lesson, press Make, and watch the same caveman act it out**
  Becomes usable: A running app with the cave-paper Start screen (Write it tab, live word counter, Try an example, Wide shape, Make my video). Pressing Make runs the offline director and plays the video in the Player: the Classic caveman acting through every scene with matching props, settings and big captions in the Bright mood. Nothing persists yet.
  Why now: This is the kernel (the same caveman acting across scenes, made from text with no AI). It also proves the whole path at once: scaffold, director, rig, Remotion composition and Player. Everything later lands on top of it.
  PRD ref: `prd.md > The Core Journey` (J1 steps 1–3, 5), `prd.md > F2 — The Start screen (first screen)`, `prd.md > F3 — Lesson input` (F3.1), `prd.md > F6 — Make (the offline director)`, `prd.md > F7 — Watch (the player)`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > App shell and navigation`, `spec.md > Start screen (F2)`, `spec.md > The director (F6)`, `spec.md > The caveman rig`, `spec.md > Video composition (Remotion)`, `spec.md > Player (F7)`, `spec.md > Making progress screen (F6)`, `spec.md > File Structure`
  Build:
    - Scaffold Vite + React + TypeScript with Tailwind 4 theme tokens, fonts and the sticker buttons. Add `.gitignore` entries (node_modules, dist, test output, `.claude/settings.local.json`, `.check-public.local`) and confirm `npm run check:public` runs before commits.
    - Copy the needed SVG drawings from stickmotion into `public/assets/`, and write `assets/manifest.json` (names, tags, synonyms) plus `assets/LICENSE-ASSETS.md` (CC0, with provenance: AI-assisted, created Oct 5–13 2026, pre-existing work disclosed). Start the README with the "Pre-existing work and AI assistance" section.
    - Build the director pipeline: clean, split, group, act, props, setting, caption, timing (seeded).
    - Build `CavemanRig` in the Classic style with all 16 motion tables and 6 expressions, plus a blink and a "talk" mouth cycle.
    - Build the `LessonVideo` composition with the Bright mood.
    - Add the Player with play/pause, the scrub bar, scene thumbnails and keyboard controls.
    - Add the Start screen, including the topic-only and length rules.
    - Add the making progress screen.
  Verify (mechanical):
    - `npm run build` succeeds with no type errors.
    - Vitest director tests pass: the same text gives the same scene plan, blank lines force scenes, a question picks think or shrug, "yay" picks celebrate, unmatched words give a caption-led scene, and captions are capped at ~5 words.
    - A Playwright script starts the dev server, pastes the example, presses Make, and confirms the Player renders ≥ 3 scenes with the caveman SVG present in each.
  Learner check: Run `npm run dev`, open http://localhost:5173, tap Try an example (or paste your own lesson) and press Make my video. Watch it: is it the same caveman in every scene, and does his acting fit the words? Does the Start screen feel like the cave-paper sketchbook you described?
  Commit: `Make a lesson into an acted caveman video in the player`

- [x] **2. Download the video as an MP4, with sound**
  Becomes usable: Download video opens the export panel (Standard 720p or HD 1080p, end card toggle). It renders the same composition into an MP4 in the browser, with progress, time left and Cancel, and saves `<topic>-heycaveman.mp4` with gentle sound effects and the end card.
  Why now: Biggest technical risk (`spec.md > Decisions and Open Issues`, unknown 2): can the browser turn our scenes into an MP4 with audio in sync, with nothing leaving the device? This slice also moves the player onto our own SVG renderer (see Revisions), so preview and export share one drawing code path.
  PRD ref: `prd.md > F13 — Download video (export)`, `prd.md > F11 — Sound effects`, `prd.md > F12 — Education extras` (end card)
  Spec ref: `spec.md > Video scene renderer (SVG)`, `spec.md > Player (F7)`, `spec.md > Export (F13)`, `spec.md > Sound effects (F11)`, `spec.md > Education extras (F12)`, `spec.md > Important Failure Modes`
  Build:
    - Replace Remotion: `video/SceneSvg.tsx`, `video/timeline.ts` and `video/spring.ts`, plus our own player clock, scrub bar and thumbnails, with no visible change from slice 1.
    - The 10 CC0 sound effects are already copied (slice 1).
    - The director's `sfx.ts` and the composition's `<Audio>` layers.
    - The end card scene.
    - `export/capability.ts`, `export/renderMp4.ts` (SVG frame → canvas → Mediabunny `CanvasSource`, H.264), `export/audioMix.ts` (OfflineAudioContext → Mediabunny `AudioBufferSource`, AAC), and the `ExportPanel` with progress, Cancel and hidden-tab pause.
    - Sound effects in the player through Web Audio.
  Verify (mechanical):
    - A Playwright script exports a 10 s two-scene video. `ffprobe` (or Mediabunny in the test) confirms an H.264 video track at 1280×720, an audio track, a duration within ±0.2 s of the plan, and audio onset aligned with the first sound effect within one frame.
    - A 1-minute 720p export is timed and the result recorded.
    - Cancel stops within 2 s with no file.
    - A browser without `VideoEncoder` shows the explanation instead of starting.
  Learner check: Make a video, press Download video, Standard, Start. Open the downloaded file in VLC or Windows Photos: does it look and sound exactly like the player, and does the end card appear?
  Commit: `Export MP4 with sound effects and end card in the browser`

- [x] **3. It works offline and remembers your work**
  Becomes usable:
    - The app installs, shows "Getting ready for offline… N%" then "✓ Works offline", and works with Wi-Fi off.
    - The draft and every project auto-save on the device.
    - My videos lists projects (open, rename, duplicate, delete with Recently deleted), with a Continue chip on Start.
    - Save project file and Open a file use `.caveman`.
    - Storage-blocked, low-space, update and two-tab states show the PRD's banners.
  Why now: Completes M1. "Offline, nothing leaves the device" is the product's promise, and persistence is where the data model can be wrong. Proving it now means every later feature saves correctly from day one.
  PRD ref: `prd.md > F1 — App load & offline readiness`, `prd.md > F14 — My videos (saving & files)`, `prd.md > The Core Journey` (J2), `prd.md > States and Boundaries`
  Spec ref: `spec.md > Offline readiness and install (F1)`, `spec.md > My videos and files (F14)`, `spec.md > Data Model`, `spec.md > Where It Runs and How Someone Tries It`
  Build:
    - `vite-plugin-pwa` with precache progress, the install prompt and the update prompt.
    - `storage/db.ts` (IndexedDB stores: projects, blobs, settings) and the debounced autosave.
    - `projectFile.ts` (zip, `formatVersion`, unknown fields kept).
    - `VideosPage` with Recently deleted purge, `tabs.ts` (BroadcastChannel), `quota.ts`, and the in-memory fallback plus banners.
  Verify (mechanical):
    - Vitest: a `.caveman` round-trip is identical, and unknown fields are preserved.
    - A Playwright script against `npm run preview`: wait for "Works offline", set the browser context offline, reload, make and export a video, and confirm it appears in My videos after a reload.
    - A private-context run shows the storage banner.
    - `dist/` size is recorded against the 15 MB budget (spec self-review note).
  Learner check: Run `npm run build` then `npm run preview`, open http://localhost:4173, and wait for "Works offline". Turn Wi-Fi off, reload, make a video and download it. Close the browser, reopen it: is your video in My videos?
  Commit: `Work fully offline with auto-saved projects and project files`

- [x] **4. Give the caveman a voice**
  Becomes usable:
    - Caveman voices: a one-time ~90 MB download with progress and resume, then offline voicing, voice choice and speed, hear sample, and mouth movement from loudness.
    - Record my voice: teleprompter, countdown, level meter, playback, re-record, silence check, 60 s limit.
    - No voice.
    - Mixed voices per scene, and "Voice out of date — redo" after edits.
    - Voiced MP4 export.
  Why now: Moved up from slice 7 after the first hands-on checkpoint: the learner found the video missing a voice, which matters most for the demo. It's a heavy download and a separate risk (`spec.md > Decisions and Open Issues`, unknown 3), and it plugs into the scenes and export that now exist. Scene editing (later) marks voices out of date.
  PRD ref: `prd.md > F10 — Voice`, `prd.md > F13 — Download video (export)` (voices out of date)
  Spec ref: `spec.md > Voice (F10)`, `spec.md > The caveman rig` (lip-sync), `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`
  Build: `kokoroWorker.ts` and `voiceClient.ts` (q8, WASM or WebGPU), the device capability check, clips and loudness envelopes stored in IndexedDB, scene timing from voice duration, `recorder.ts`, the Voice panel, stale flags, and the export "update voices first?" prompt.
  Verify (mechanical):
    - Record the voice list, download size and seconds per scene in Revisions.
    - Playwright: with the model loaded, go offline, make a 3-scene video, confirm each scene has an audio blob and its duration matches, and export, confirming an MP4 audio track. A recording with fake microphone input is kept, and a silent one is rejected.
  Learner check: Download the voices, pick one, and make a video. Then record your own voice for one scene. Does his mouth move with the voice, and does the downloaded MP4 have both voices?
  Commit: `Add offline caveman voices and voice recording`

- [x] **5. Tap a scene to change it, with undo**
  Becomes usable: Tapping a thumbnail opens the scene panel to change words, caption and style, caveman action and face, background, props, and sound, and to duplicate, delete, move or add a scene. Every change shows instantly, and undo/redo keeps at least 50 steps. The Re-make prompt protects scene edits.
  Why now: Completes the core loop's "watch and tweak" step. It needs scenes, moods and shapes in place first.
  PRD ref: `prd.md > F8 — Quick scene edits (tap a scene)`, `prd.md > F6 — Make (the offline director)` (Re-make prompt)
  Spec ref: `spec.md > Scene panel and undo (F8)`, `spec.md > Data Model`
  Build: `ScenePanel` (side panel or bottom sheet), animated motion and face chips, the history stack in the store with Ctrl+Z / Ctrl+Y, the scene actions with the PRD's guards, and the Re-make confirm.
  Verify (mechanical):
    - Vitest: 50 edits followed by 50 undos gives back the original project, and deleting the only scene is blocked.
    - Playwright: change one scene's prop, caption and motion, and confirm the Player frame updates and the change survives a reload.
  Learner check: Make a video, tap scene 2, change his action to "celebrate", swap a prop, and edit the caption. Try undo. Could a teacher do it in under 30 seconds?
  Commit: `Add quick scene editing with undo and redo`

- [x] **6. The Editor for hand-made scenes**
  Becomes usable:
    - The Editor: a scene list with drag-to-reorder and durations.
    - The stage: drag, resize and rotate props and the caveman with snap guides, and when each prop appears and disappears.
    - A searchable prop library, multiple captions per scene with timing, and the character designer.
    - Uploads of your own pictures (resized, 5 MB limit), kept in the project file.
  Why now: M4 power-user control. It depends on everything before it and isn't needed for the core loop, so it comes late.
  PRD ref: `prd.md > F9 — Editor (more control)`
  Spec ref: `spec.md > Editor (F9)`, `spec.md > Data Model`
  Build: `Editor/` (SceneList, Stage overlay with pointer handles in percentages, PropLibrary search over the manifest, CaptionTrack), upload resize to IndexedDB blobs, and uploads included in `.caveman` files.
  Verify (mechanical):
    - Vitest: placement percentages survive a shape switch inside the frame, and a `.caveman` file with uploads round-trips.
    - Playwright: build a 3-scene video from scratch (set backgrounds, add props, write captions) and play it.
  Learner check: Open Edit, drag a prop, resize it, search "lungs" in the library, and upload one of your own pictures. Does it feel intuitive?
  Commit: `Add the editor with stage, prop library and picture upload`

- [x] **7. Meet your caveman, and choose the shape and colour mood**
  Becomes usable:
    - The first Make shows the Meet your caveman sheet: 4 presets, Customise with the Cartoon style (clothes, hair, glasses, facial hair, skin tone, colours, head size, name) and a live waving preview. It's saved as My caveman, with each project keeping its own copy.
    - Wide, Tall and Square work on Start and in the Player.
    - The Colour mood (Bright, Earthy, Soft) switches in the Player, with the contrast check and no neighbouring background repeats.
  Why now: Makes the kernel personal ("set your caveman up once"). Shapes and moods change the layout of every scene, so they should land before scene editing builds on that layout.
  PRD ref: `prd.md > F4 — Meet your caveman (character setup)`, `prd.md > F5 — Video shape`, `prd.md > Look and Feel` (Inside the video), `prd.md > F7 — Watch (the player)`
  Spec ref: `spec.md > Meet your caveman (F4)`, `spec.md > The caveman rig`, `spec.md > Video composition (Remotion)`, `spec.md > Look and Feel`
  Build: `CavemanSheet` and presets, the Cartoon rig layers, the "just this video or all new videos" prompt, shape presets with percentage-based layout and Tall margins, `moods.ts` and `contrast.ts`, the toolbar switches, and the locked premium style cards.
  Verify (mechanical):
    - Vitest: every mood passes ≥ 7:1 caption contrast, no two neighbouring scenes share a background, and a mood switch changes only background, caption and word-art colours.
    - Playwright: the first Make shows the sheet once (and not on the second Make), Skip still makes a video, and exports in all 3 shapes have no caption or caveman bounding box outside the frame.
  Learner check: Clear the site data, press Make, and design your own caveman. Is he identical in every scene? Switch to Tall and Earthy: does it still look right?
  Commit: `Add caveman designer, video shapes and colour moods`

- [x] **8. Teacher tools: Lesson Builder, templates and lesson scenes**
  Becomes usable:
    - The Start from a topic Lesson Builder, with Turn into text.
    - The 6 templates, with grey examples.
    - The link card for pasted YouTube or other links.
    - Title, quiz (countdown, reveal, multiple choice), recap and end cards.
    - Key-word highlights, pause points, reading speed, the Sound effects On/Gentle/Off setting, and Shuffle.
  Why now: Turns the engine into a teacher's product (M2). It builds on the director and scenes that now exist, before editing tools.
  PRD ref: `prd.md > F3 — Lesson input` (F3.2–F3.4), `prd.md > F12 — Education extras`, `prd.md > F11 — Sound effects`, `prd.md > F6 — Make (the offline director)` (Shuffle, structure)
  Spec ref: `spec.md > Lesson Builder and templates (F3)`, `spec.md > Education extras (F12)`, `spec.md > The director (F6)`, `spec.md > Sound effects (F11)`
  Build: `LessonBuilder` and `buildScript`, `templates.ts`, `LinkCard`, `structure.ts` scene kinds and their composition scenes, the quiz scene, `caption.ts` highlights, pause points in the Player, reading speed in `timing.ts`, the SFX level setting, and Shuffle with a new seed.
  Verify (mechanical):
    - Vitest golden tests: each template's grey example builds a script in the order hook → points → example → recap → quiz → outro, and a video of 30–90 s.
    - A script measures ≥ 70% of scenes with a matching prop or setting across all 6 template examples.
    - Shuffle changes props and poses but not text.
    - A quiz without an answer shows "Discuss!".
  Learner check: Pick the "Explain a concept" template, fill in only the topic and two points, and make it. Do the title card, quiz and recap work the way you'd use them in class?
  Commit: `Add Lesson Builder, templates and quiz, recap and title scenes`

- [x] **9. Classroom-ready and open-source ready, plus the HeyCaveman bridge**
  Becomes usable:
    - Settings: Classroom mode (also via `?classroom`), defaults, Appearance (Light, Dark, device), My caveman, and storage tools.
    - Help (illustrated, offline), About (licences, credits, privacy promise) and Report a problem.
    - The premium bridge (More looks shelf, locked items, Lesson Builder footer, Open in HeyCaveman with the launch discount code), all dismissible and hidden in Classroom mode.
    - An accessibility pass.
    - README, `LICENSE` (unmodified AGPL-3.0, detected by GitHub), `LICENSE-ASSETS.md` (CC0, with provenance), and the For-schools privacy sheet.
  Why now: M4 polish plus M5. It wraps finished features without changing them, and it's last because it can be cut down if time runs short.
  PRD ref: `prd.md > F16 — Settings, help & about`, `prd.md > F15 — The bridge to HeyCaveman (premium)`, `prd.md > Non-Functional Requirements` (Accessibility, Privacy and child safety), `prd.md > Product Decisions`
  Spec ref: `spec.md > Settings, help and about (F16)`, `spec.md > Premium bridge (F15)`, `spec.md > Look and Feel`, `spec.md > External Services and Dependencies`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Settings, Help and About screens; `premium.ts` mentions with dismiss and classroom checks; the handoff; the dark theme; keyboard focus order and labels; reduce-motion; 200% zoom fixes; and the repo documents.
  Verify (mechanical):
    - The Playwright axe-core scan reports no serious violations on Start, Player and My videos.
    - With `?classroom`, zero premium mentions are visible. Without it, at most 2 appear during a full make, edit and export run.
    - A network log during a full offline run shows zero requests to other domains (except the voice model download when chosen).
    - `npm run build` passes.
  Learner check: Open `?classroom`. Is it clean enough to share with students? Then try dark theme, the help guide and About.
  Commit: `Add settings, classroom mode, help, premium bridge and open-source docs`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 3 (make, export, offline end to end); feedback can still shape slices 4–9. Learner tried the build; feedback: "voice over is not coming" → voices moved up to slice 4.
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Replaced Remotion (player and web renderer) with our own SVG scene renderer plus Mediabunny for MP4 export (learner chose this in slice 2). The build found that `@remotion/web-renderer` sends a usage event (site address, success) to remotion.pro on every export, even with the free licence, which breaks the PRD's "nothing leaves the device" promise and its "zero requests to other domains" check. The AGPL Remotion exception was dropped with it. Slice 1's director, rig and design are unchanged.
- Slice 2 measurements: the exported MP4 is H.264 1280×720 with AAC 48 kHz stereo. The first sound effect starts at 0.150 s (planned 0.15 s) and the "Remember" ding at 4.150 s (scene start + 0.35 s). The export made zero requests to other domains. Speed on the build PC (headless Chromium): an 84 s video exported in 91 s, about 1.1× real time. The PRD budget (1 min in under 2 min on a Chromebook) needs re-checking on slower hardware; frame painting is the cost to optimise if needed.
- The offline helper is our own small service worker (`src/offline/sw.ts`). `vite-plugin-pwa` only injects the file list and writes the install manifest, because Workbox's built-in precaching can't report the per-file progress behind the PRD's "Getting ready for offline… N%" strip. The first download is 94 files, 4.95 MB, well inside the PRD's 15 MB budget. The `.woff` font fallbacks are left out, since every supported browser uses `.woff2`.
- Voices moved from slice 7 to slice 4 after the first hands-on checkpoint (learner: "voice over is not coming"). The later slices shift down one place; nothing was cut.
- Slice 4 measured: offline voicing about 23 s per scene on a cold start (warm-up added when the panel opens); recording tests use Chromium's fake microphone, split into two files because launch flags must be top-level.
- Reordered on the learner's request ("allow users to edit the video scenes"): Tap a scene (was 7) and the Editor (was 8) now come right after voices as slices 5 and 6; Meet your caveman and Teacher tools move to 7 and 8. No scope change.
- Slice 5: on phones the scene panel sits under the video, so the video now stays pinned at the top while a scene is open; caption colours (Yellow/Red/White/Outlined) are drawn by the renderer and override the mood. Re-make of an edited video replaces it in place, and one Undo brings the edits back.
- Slice 6: the Editor's Character button (F9.5) opens the caveman designer, which is built in slice 7, so it moves there. The "Need more pictures? HeyCaveman…" line at the end of the library moves to slice 9 with the other premium mentions. Uploaded pictures are stored as WebP (keeps transparency) and travel in .caveman files as images/<id>.webp. Found while testing: opening a .caveman file lost voiceId/voiceSpeed (they were treated as unknown fields); fixed. A drawing can no longer be wider than a tall frame.
- Slice 7: the shape check runs on the real renderer in the player (the export draws the very same SVG), across Tall/Earthy, Square/Soft and Wide/Bright. Caption text passes 7:1 in every mood; the Soft key-word colour is 4.5:1 (large bold text), not 7:1. Premium caveman styles show as Cartoon with a note. Tests start with "Meet your caveman" already seen, except the slice 7 tests.
- Design revision (learner request after slice 7: the look, colours and fonts felt like "AI slop"; wanted futuristic, wow, animations, sound effects, intuitive). Restyled the whole app as "Neon Stone Age" (prd.md > Look and Feel v3): night-cave aurora canvas, glass panels, ember-gradient actions, Unbounded + Manrope fonts (Fredoka and Atkinson removed), screen and list motion, a live hero caveman, and synthesized UI sounds with a mute switch. The video's own look is unchanged. All tests still pass.
- Design revision 2: the learner still disliked v3 and sent the Slush site as the reference. Rebuilt as "Sticker Cave" (prd.md > Look and Feel v4): pastel paper sheet in a black frame, marquee, Anton + Inter Tight, black-outlined pills and cards, flat sticker colours, a grainy inflatable blue ribbon behind a giant HEYCAVEMAN wordmark with our CC0 drawings as stickers. No gradients or shadows. Unbounded and Manrope removed. All tests still pass.
- Slice 8: two grey examples changed so the bundled drawings can show them (Word of the day: "Delicious" instead of "Enormous"; Myth vs fact: reading in dim light instead of goldfish memory). With no matching drawing, a lesson scene keeps the lesson's main drawing on screen. Measured: 34 of 34 spoken scenes show a drawing across the 6 examples (counting the main-drawing fallback), and every example runs 30–90 s. The F3.2 premium footer line moves to slice 9 with the other premium mentions.
- Slice 9: Appearance offers Paper (light, default), Night (dark) and Match my device. The launch discount code shown at the HeyCaveman handoff is a placeholder constant (STONEAGE) for the company to set. LICENSE is the unmodified AGPL-3.0 text from gnu.org (34,523 bytes). The Editor's Character button (moved from slice 6) opens the designer and asks just-this-video or also-my-caveman.
- Performance (learner: "site has become very slow"): measured with a frame-rate probe in Chromium. Start screen 16 fps → 56–58 fps (the ribbon's grain filter was re-rasterised every frame by its drift animation; now drawn once and moved on the GPU, and only the live caveman redraws). Player with the scene panel open 48 → 60 fps (thumbnails and the panel no longer re-render on every video frame). Play now starts the picture immediately and the sound joins in sync after decoding, instead of waiting for every clip first.
- Performance, round 2 (learner: "landing page lags a lot"). Profiled the production build with the CPU slowed 4x: the live SVG grain filter re-rendered on every frame of the ribbon's intro (intro 24 fps, a 150 ms freeze), the scrolling marquee caused most of the per-frame restyles, the rounded clip on the paper sheet forced every animated layer through a mask, and the hero parallax made every sticker repaint on each mouse move. Fixes: the ribbon is pre-rendered once to a 162 KB WebP (scripts/make-ribbon.mjs) and stays still after sliding in; stickers are still after popping in (wiggle on hover); only the caveman leans toward the pointer, on his own layer; he acts for ~2.7 s then rests without redrawing, at 20 fps, and stops when scrolled away; the sheet no longer clips (the body clips sideways). The headless test browser has no GPU, so its numbers are noisy (throttled intro now about 30-47 fps); the real check is the learner trying the production build.
- Finish-to-submit pass (Oct 22–23, PRD pack outside the repo; audit in `docs/stoneage-audit.md`). NAV: screen changes now record browser history, so Back and Forward move between screens; Making is replaced by the video so Back never re-runs Make; Player and Editor redirect to Start in an effect. PLAYER: the video, its control bar (now under the video, never over the caption), Download video and the scene strip fit one 1440×900 screen; Download video is the only filled button; shape, mood, reading speed, Shuffle and Save project file moved into a Look / Voice / Scene side card; the voice download offer lives in the Voice tab, which opens the existing voice dialog through "Voice settings"; the "saved in this browser" note is a line in the Look tab instead of a banner on the Player. The launch code is hidden until HeyCaveman confirms one. Deferred: folding the scene panel's background and sound under "More".
- MATCH (Oct 23): words that name a thing now beat weak hints ("day", "bright", "remember", "food", "drink", "fly"), so "Leaves catch the bright sunlight every day" shows a leaf and the sun instead of a calendar and a light bulb. A weak hint brings one drawing only when nothing is named. Plurals and short endings count fully ("plants", "sleepy"); long look-alikes don't ("window" is not "win*"). Ties go to the earlier word. A lesson's own topic drawing may repeat rather than give way to a weak hint. Six new CC0 drawings (sun, leaf, cloud, rain, tree, water drop, made Oct 22 with AI assistance) take over sun/leaf/tree/water/rain words from star, plant and water bottle. `tests/director/matching.test.ts` pins the drawings for the plant lesson, the example and all 6 templates. The slice 5 e2e test now removes drawings one at a time (its old loop clicked a button that had already gone).
- BRAND + CLUTTER (Oct 23): the logo is redrawn in the sticker palette (ember hand, black outline) and the app icons and install colours use the sky paper (#dceeff). Night now comes from tokens: cards and pills read `bone` and the new `outline`, warnings use the new `warn` (they were "ochre", which is black), focus rings use the new `focus`; old orange slider accents and the brown dialog backdrop are gone; a saved Night choice is applied before the first paint. Moss and berry are a shade darker so small text passes 4.5:1. On wide screens the Start hero sits beside the lesson card, so Make my video is on the first screen. Each My videos card has Open plus an "Options" menu (Rename, Duplicate, Save as file, Delete); Delete shows an Undo toast instead of a browser confirm box.
