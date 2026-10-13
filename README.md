# HeyCaveman: Stone Age

**Type a lesson, get a cartoon explainer video — in your browser, offline, free, with nothing leaving your device.**

Stone Age is the free, open-source edition of HeyCaveman. A teacher pastes a lesson, presses **Make my video**, and the same friendly caveman acts it out scene by scene, with matching drawings and big captions. There's no account, no tracking and no AI: an offline "director" turns plain text into scenes with simple word rules.

> Status: in active development for the Devpost "Build With AI: Basics" hackathon. Planning documents: [`devpost/scope.md`](devpost/scope.md), [`devpost/prd.md`](devpost/prd.md), [`devpost/spec.md`](devpost/spec.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # director unit tests
npm run test:e2e   # browser tests (first: npx playwright install chromium)
```

## Pre-existing work and AI assistance

- **New code:** all application code in this repository was written during the hackathon, with an AI coding agent (Claude Code), following the Devpost Learn Skill Pack (`.agents/skills/`).
- **Copied assets (pre-existing work):** the drawings, sound effects and music are copied from the author's earlier HeyCaveman project, where code written with AI assistance generated them on 5–13 October 2026. They're released here under CC0. No code from that project is reused. Details: [`assets/LICENSE-ASSETS.md`](assets/LICENSE-ASSETS.md).

## Licence

- **Code:** AGPL-3.0.
- **Art and sounds:** CC0 (see `assets/LICENSE-ASSETS.md`).
- **Privacy:** the app has no analytics or usage pings. Videos are drawn and encoded in your browser with [Mediabunny](https://mediabunny.dev) (MPL-2.0).
