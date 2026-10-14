# HeyCaveman: Stone Age

**Type a lesson, get a cartoon explainer video — in your browser, offline, free, with nothing leaving your device.**

Stone Age is the free, open-source edition of HeyCaveman. A teacher pastes a lesson, presses **Make my video**, and the same friendly caveman acts it out scene by scene, with matching drawings and big captions. There's no account, no tracking and no AI: an offline "director" turns plain text into scenes with simple word rules.

> Built for the Devpost "Build With AI: Basics" hackathon. Planning documents: [`devpost/scope.md`](devpost/scope.md), [`devpost/prd.md`](devpost/prd.md), [`devpost/spec.md`](devpost/spec.md).

## What it does

- **Write it, or start from a topic.** Paste a lesson, or fill the Lesson Builder's blanks (topic, hook, key points, example, recap, quiz), or start from one of six templates: Explain a concept, a story from history, step by step, word of the day, myth vs fact, book summary.
- **Make.** The offline director splits the text into scenes, picks one of 16 actions and a face for the caveman, finds matching drawings and settings, writes big key-word captions, adds gentle sound effects and times every scene. Same text, same video, every time; **Shuffle** re-rolls the poses and drawings.
- **Lesson scenes.** A title card, a recap card, and a quiz with a thinking countdown, then the answer (or "Discuss!") with a ding. Multiple choice highlights the right answer.
- **Your caveman.** Four presets or your own design (style, skin, clothes, hair, glasses, beard, head size, name), saved once for every new video.
- **Tweak.** Tap any scene to change its words, caption, action, face, background, drawings or sound. Undo and redo (Ctrl+Z / Ctrl+Y). The Editor adds a stage with drag, resize and rotate, a searchable library, timed captions and your own pictures.
- **Voices.** Natural voices that run on your device after one 90 MB download (Kokoro-82M), or record your own. The mouth moves with the voice.
- **Shapes and moods.** Wide, Tall or Square; Bright, Earthy or Soft colours.
- **Classroom.** Pause points for discussion, reading speed, Classroom mode (`?classroom`) that hides every HeyCaveman mention.
- **Share.** Download an MP4 made right in the browser, or save a `.caveman` project file (voices and pictures included) to open anywhere.
- **Offline.** After the first visit it works with no internet at all.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (director, editing, storage, lessons)
npm run test:e2e   # browser tests (first: npx playwright install chromium)
npm run build      # static site in dist/ — host it anywhere
```

## Privacy

No account, no analytics, no usage pings, no cookies. Lessons, videos, recordings and pictures stay in the browser on your device. The only network requests the app ever makes are its own files and, if you choose Caveman voices, the one-time voice model download from Hugging Face. Links to GitHub and HeyCaveman open only when you click them. See [`docs/for-schools.md`](docs/for-schools.md).

## Pre-existing work and AI assistance

- **New code:** all application code in this repository was written during the hackathon, with an AI coding agent (Claude Code), following the Devpost Learn Skill Pack (`.agents/skills/`).
- **Copied assets (pre-existing work):** the drawings, sound effects and music are copied from the author's earlier HeyCaveman project, where code written with AI assistance generated them on 5–13 October 2026. They're released here under CC0. No code from that project is reused. Details: [`assets/LICENSE-ASSETS.md`](assets/LICENSE-ASSETS.md).

## Licence

- **Code:** [AGPL-3.0](LICENSE).
- **Art and sounds:** CC0 — see [`assets/LICENSE-ASSETS.md`](assets/LICENSE-ASSETS.md).
- **Libraries:** Mediabunny (MPL-2.0) encodes the video; kokoro-js (Apache-2.0) runs the voices; fonts Anton, Inter Tight and Baloo 2 (SIL Open Font License); icons Lucide (ISC).
