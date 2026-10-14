# HeyCaveman Stone Age — for schools

A one-page privacy and safety sheet for teachers, IT staff and school leaders.

## In one line

**No account. No tracking. Your lessons never leave your device.**

## What the app is

A free, open-source web app that turns a lesson's text into a short cartoon video. It runs entirely in the browser. After the first visit it works offline.

## Data

| Question | Answer |
|---|---|
| Does anyone need an account? | No. There is no sign-up and no login. |
| Is any personal data collected? | No. There are no analytics, cookies, usage pings or crash reports. |
| Where are lessons and videos stored? | In the browser on the device that made them (IndexedDB). Clearing browser data removes them. |
| Are recordings of voices uploaded? | No. Microphone recordings stay on the device and only go where the teacher saves the project file or video. |
| Are uploaded pictures sent anywhere? | No. They are resized on the device and stored with the project. |
| What network requests does it make? | Its own files (from wherever the school hosts it) and, only if a teacher chooses Caveman voices, a one-time 90 MB voice-model download from Hugging Face. |
| Are there ads or upsells? | The app mentions HeyCaveman (the company behind it) in a few places. **Classroom mode** hides all of them. |

## Classroom mode

Open the app with `?classroom` at the end of the address (for example `https://your-school-host/?classroom`) or switch it on in Settings. It:

- hides every HeyCaveman mention and locked item;
- keeps the end-card choice the teacher set in Settings.

Share the `?classroom` link with students to give them the clean version.

## Child safety

- No chat, no sharing, no public gallery: nothing a child makes is published by the app.
- All bundled drawings were reviewed for children (`kidSafeReviewed` in `assets/manifest.json`).
- There is no photo-face option for the caveman.
- Links out (the code on GitHub, HeyCaveman, Report a problem) only open when clicked, in a new tab, and Report a problem shows exactly what will be shared first.

## Accessibility

- Every control is reachable by keyboard; the player has Space, ← and → shortcuts, and undo is Ctrl+Z.
- Automated checks (axe-core) report no serious problems on the main screens.
- Reduced-motion settings stop the app's animations.
- Captions inside videos keep a 7:1 contrast against their outline or band.

## Hosting it yourself

The app is a static site. Run `npm run build` and serve the `dist/` folder from any web server or static host. No server code and no database are needed.

## Licence

Code: AGPL-3.0. Art and sounds: CC0. See the repository's `LICENSE` and `assets/LICENSE-ASSETS.md`.
