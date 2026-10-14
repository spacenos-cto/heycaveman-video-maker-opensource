---
doc: prd
status: approved
---

# HeyCaveman: Stone Age — Product Requirements

Type a lesson, get a cartoon explainer video, in your browser, offline and free, with nothing leaving your device. For school teachers first, then students, tutors and homeschool parents, NGO trainers and hobby creators.

Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`. Carried over from the learner's own Stone Age PRD (v2, 2026-10-13); product thinking and wording are theirs.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

```
 1. WRITE           2. MAKE              3. WATCH & TWEAK        4. GET IT
 type / paste   →   one button       →   play it, tap a      →   download MP4
 or build from      (first time: pick    scene to change it      or save the
 a topic            your caveman)                                project file
```

**Target:** a first-time visitor gets a finished video file in under 3 minutes on a school Chromebook, without reading instructions.

**J1 — First visit (online)**
1. A teacher opens the site from a search or a GitHub link.
2. The Start screen appears instantly (F2). In the background the app quietly saves itself for offline use; a small strip shows "Getting ready for offline… 60%", then "✓ Works offline now".
3. They tap **Try an example** (or paste their own lesson) and press **Make my video**.
4. A one-time **Meet your caveman** sheet appears (F4): they pick a preset, tweak colours, or skip.
5. A making-progress screen (F6), then the video plays (F7).
6. Voice: if built-in voices aren't downloaded yet, the app offers them (F10). Until then, the preview plays with captions and sound effects.
7. They tap **Download video** (F13) and an MP4 file is saved.

**J2 — Returning, offline**
1. No internet. They open the installed app or the bookmark.
2. The app opens normally; the header shows an "Offline" pill, informational and not an error.
3. "My videos" shows previous projects, and everything works, including voices if downloaded.

**J3 — Student class project**
1. A student opens the link the teacher shared. No sign-up, nothing to accept.
2. They pick the template **Explain a concept**, fill the blanks and make the video.
3. They record their own voice for each scene (F10).
4. They download the MP4 and also **Save project file**, to hand in or continue at home.

**J4 — Upgrade moment**
1. A tutor has made 10 videos and wants the storybook look or AI script writing.
2. They tap **More looks** or the Lesson Builder note, then "Open in HeyCaveman".
3. The current project is carried over (file handoff, F15), so nothing is re-typed.

**Success:** an MP4 the person can project or share, made offline, with the same caveman acting through every scene.

## Screens and Layout
One-column web app, centred, max ~720 px wide on the Start screen. The surfaces, and how people move between them:
1. **Start screen** (F2): Write it / Start from a topic (Lesson Builder, F3.2) / Use a template (F3.3) tabs over one big text box, a shape picker, and **Make my video**.
2. **Meet your caveman sheet** (F4): slides up the first time **Make** is pressed. Later it opens from the header's caveman avatar and from the Editor.
3. **Making progress** (F6): replaces the Start screen while making, then hands off to the Player.
4. **Player** (F7): the video, scrub bar, scene thumbnails, and a toolbar (shape, Colour mood, Shuffle, Voice, Edit, Download video, Save).
5. **Scene panel** (F8): a side panel (a bottom sheet on small screens) opened by tapping a scene thumbnail.
6. **Editor** (F9): opened from **Edit**: scene list, stage, prop library, captions, character, uploads.
7. **Download panel** (F13): a small panel from **Download video**, then export progress and a done card.
8. **My videos** (F14): from the header; a grid of project cards, plus New video and Open a file.
9. **Settings, Help, About** (F16): from the header's ⋯ menu.

The header is on every screen: the logo, an offline status dot or pill, **My videos**, **Install app** (when available), and the ⋯ menu.

## Look and Feel
Source: `scope.md > Inspiration & Identity`. Learner's v2 direction, kept word for word, then updated by v4 and v3 below.

> **v4 — Sticker Cave (learner's request, Oct 14 2026, with a Slush reference: "the UI is still very bad… I want it to look like this, with cool animations"). Supersedes v3 below.** The app is a sticker book on pastel paper:
> - **Frame:** a black page holding one big rounded sky-wash (#DCEEFF) sheet; a lavender marquee strip scrolls across the top.
> - **Type:** Anton (condensed poster display, uppercase, crushed leading) + Inter Tight (body, buttons in bold uppercase with open tracking). Video captions stay Baloo 2.
> - **Controls:** pill buttons with 1.5px black outlines on white; the primary action is a black pill that flashes ember on hover; chosen things turn sunburst yellow. Cards are white with black outlines, 24px corners. No drop shadows, no gradients.
> - **Sticker palette:** electric blue #4DA2FF, mint #55DB9C, lavender #E9CCFF, ember #FB4903, sunburst #FFD731, violet #5C4ADE, used together as flat fills.
> - **Signature:** a grainy inflatable blue ribbon (layered SVG strokes) loops behind a giant HEYCAVEMAN wordmark, with the bundled CC0 drawings stuck around it as stickers and the caveman standing in front.
> - **Motion:** wordmark letters jump in one by one, the ribbon draws itself, stickers pop in, bob and wiggle when touched, buttons tilt on hover, screens rise in; the hero caveman acts and leans toward the pointer. Reduced motion stops it all. UI sounds as in v3.

> **v3 — Neon Stone Age (learner's request, Oct 14 2026: "futuristic… the jury should say wow"; the v2 look and fonts read as generic).** This replaces v2's *app* look; everything **inside the video** (moods, caption font, caveman) is unchanged.
> - **Canvas:** a night cave: deep #07070D with slow-moving aurora light (violet, magenta, cyan, a little ember), faint stars and film grain. A Daylight variant exists for Settings › Appearance.
> - **Surfaces:** frosted glass panels; dialogs are solid night glass over a blurred page.
> - **Actions:** pill buttons; the primary action is an ember gradient (gold → orange → pink → violet) that glows and shimmers on hover, squishes on press.
> - **Type:** Unbounded (display, wide and futuristic) + Manrope (body). Captions in the video stay Baloo 2 for young readers.
> - **The caveman outside the video** always stands on warm light (his ink is dark): a glowing orb on Start, lit cards in the designer and action chips.
> - **Motion:** screens rise in, lists stagger, drawings float, the hero caveman performs his actions and leans toward the pointer. All of it stops with reduced motion.
> - **Sound:** soft synthesized UI sounds (tap, pop, whoosh between screens, success chime, gentle "nope"), made live with Web Audio (no files), with a mute switch in the header.

**The idea in one line:** *a friendly cave-painting sketchbook.* The app feels like warm paper with charcoal ink and ochre paint. It's chunky, rounded and hand-made, so it looks like the same world as the bold-outline caveman inside the video. It should never look like a generic "AI app".

### The app around the video
**Feel:** playful but calm, and grown-up enough for a teacher. Think of a good children's picture book's cover, not a toy.

**Colours (light theme, default)**

| Role | Name | Colour | Used for |
|---|---|---|---|
| Page background | Cave paper | `#FBF6EC` | Every screen's background |
| Surface | Bone | `#FFFFFF` | Cards, panels, text boxes |
| Soft fill | Sand | `#F1E8D6` | Chips, hover, selected rows, the template cards |
| Text & outlines | Charcoal | `#1F1A17` | All main text, 2 px outlines on things you can press |
| Secondary text | Ash | `#6B5F55` | Hints, counters, captions under cards |
| Primary action | Ochre | `#E8892B` | **Make my video**, **Download video**: ochre fill with charcoal text |
| Accent / links | Terracotta | `#B8482A` | Links, the active tab underline, the logo's handprint |
| Success | Moss | `#4F7A3A` | "✓ Works offline", "Voices ready" |
| Info | River | `#3D7FC4` | Tips, the offline-ready dot |
| Error | Berry | `#B23A48` | Error text and borders |
| Dividers | Hairline | `#E3D8C4` | Thin lines between sections |

**Dark theme ("Night cave")** is optional and follows the device or Settings: background `#1C1815`, surface `#26201B`, text `#F5EDE0`, secondary text `#B5A898`, ochre `#F0923A`, outlines in the light text colour. Classrooms default to light, because projectors wash out dark screens.

**Type**

| Use | Font | Why |
|---|---|---|
| Headlines, buttons, tabs, card titles | **Fredoka** (SemiBold / Bold) | Rounded, friendly and very readable for children; matches the caveman's round shapes |
| Body text, inputs, hints | **Atkinson Hyperlegible** (Regular / Bold) | Designed for low-vision and early readers; a clear education story |
| The video's captions | The video font (see Inside the video), never the app font | Keeps the video's look the same in every app theme |

- **Base text size is 17 px**, larger than usual, for kids and classroom distance.
- **Headlines** are 40–48 px on desktop and 30 px on phones.
- **Both fonts are free (OFL) and bundled,** so they work offline.

**Shapes and depth**
1. **Things you can press** have a 2 px charcoal outline and a small solid "sticker" shadow offset 3 px down-right. When pressed, the button moves into its shadow, like a stamp.
2. **Containers** (panels, and cards you only read) have no heavy outline: a white surface, a hairline border and a very soft shadow.
3. **Corners:** 14 px for cards, 12 px for buttons, fully round for chips and pills.
4. **The selected choice** (shape card, preset caveman, template) gets an ochre outline and a small ✓ badge, not only a colour change.

**Icons and illustration**
1. **Icons:** rounded 2 px line icons from one consistent set, in charcoal, never multicolour.
2. **The caveman is the app's illustration.** Empty states, loading, errors and the help guide use the real animated caveman (waving, thinking, pushing a stone wheel), not stock art or 3D blobs.
3. **Logo:** the caveman's round head beside a terracotta handprint, the wordmark "HeyCaveman" in Fredoka, and a small "Stone Age" tag.
4. **One subtle texture is allowed:** a faint paper grain on the page background. It's off in the dark theme and in reduce-motion or high-contrast settings.

**Motion**
1. **UI movement is quick and small:** 150–200 ms, ease-out. Sheets slide up and buttons stamp down.
2. **Only the caveman gets playful loops** (loading, empty states). Nothing else bounces or wiggles.
3. **"Reduce motion"** turns UI motion into simple fades.

**Words (tone of voice)**
1. **Plain, warm and short.** Instructions are always straight: "Write at least one sentence."
2. **A little caveman humour only where nothing is at stake:** loading ("Sharpening the charcoal…"), errors ("The caveman tripped. Your text is safe."), empty states ("No videos yet. Make your first one!").
3. **Never "caveman-speak"** ("Ugh! Make video!"). Teachers and children must read it as correct English.

**Avoid (the "generic AI app" look)**
1. Purple or blue gradients, glowing "AI sparkle" icons, glassmorphism, neon.
2. Dark-first dashboards and tiny grey text.
3. Stock 3D illustrations, or emoji as decoration.
4. More than one accent colour on one screen besides ochre (status colours excepted).

### How the main screens should look
1. **Start:**
   - A cave-paper page with one centred column.
   - The headline in Fredoka, with the word "cartoon" underlined by a hand-drawn terracotta stroke.
   - A large white text box with a charcoal outline, and three tab chips above it.
   - Three big shape cards, each showing a tiny animated caveman in that shape.
   - The full-width ochre **Make my video ▶** button.
   - A small animated caveman peeking from the right edge of the text box (hidden on phones).
2. **Meet your caveman:** a sheet sliding up from the bottom, with four big preset cards, each with the live caveman on a sand circle; the chosen one waves.
3. **Player:**
   - The video sits on a charcoal "slate" frame (rounded, with a 2 px outline).
   - Scene thumbnails below look like a row of little cards.
   - The toolbar uses outlined icon buttons with labels; no icon-only buttons.
4. **Making progress:** the caveman pushes a stone wheel across the screen as the progress bar, while the steps listed beside it tick off in moss green.
5. **My videos:** a grid of thumbnail cards on cave paper, each like a polaroid (white border, slight shadow), with the title in Fredoka.

### Inside the video
**Stays the same as today:** the flat doodle look, bold black outlines, flat fills with no gradients or shading on characters and props, and the existing subtle background textures.

**Colour mood** is one tap in the player toolbar, with the default set in Settings. It changes background colours, caption highlight colours and word-art colours only. Drawings and the caveman keep their own colours.

| Mood | Feel | Background colours | Highlight / word-art | Best for |
|---|---|---|---|---|
| **Bright** (default) | Bold, saturated classroom colours, a little calmer than the premium "viral" look | Sky `#4CC9F0`, Sunshine `#FFD60A`, Mint `#06D6A0`, Coral `#FF6B6B`, Lilac `#B79CED`, Tangerine `#FF9F1C`, Cream `#FDF6E3` | Yellow `#FFD60A`, Red `#FF3B5C`, white | Most lessons; projectors and YouTube |
| **Earthy** | Stone Age: ochre, clay, moss and stone, like a cave wall in daylight | Ochre `#E3A857`, Clay `#C8754A`, Moss `#8DA65A`, Stone `#B8AFA3`, Dusk sky `#7FA7C9`, Sand `#EAD9B5` | Cream `#FFF4D6`, Charcoal outline, Terracotta `#B8482A` | History, geography, nature, storytelling |
| **Soft** | Gentle pastels, low glare | Blush `#FFD6E0`, Baby sky `#CDEBFF`, Mint cream `#D8F5DD`, Butter `#FFF1B8`, Lavender `#E6DCFF` | Charcoal text with a coloured underline instead of glowing colours | Younger classes (5–8), calm topics, emotional and wellbeing lessons |

**Captions and word-art**
1. **One heavy, rounded display font for all captions,** chosen in `4-spec` and bundled so every computer shows the same thing.
2. **Caption colours:** white or yellow with a thick black outline (Bright, Earthy), or charcoal on a light band (Soft).
3. **Minimum caption height** is 6% of the video's short edge, so text is readable from the back of a classroom.
4. **The key word** in each caption is in the mood's highlight colour.

**Projector rules (all moods)**
1. **No pure white full-screen backgrounds** (glare); cream instead.
2. **Caption contrast:** text against its background or outline must stay strong (at least 7:1 effective), checked automatically when a mood is applied.
3. **Neighbouring scenes never repeat a background colour,** so scene changes are visible.

**Edge cases**
1. **Premium project files** keep their own colours. The mood switch is disabled for them, with the note "This video uses HeyCaveman colours."
2. **Scenes with an uploaded picture background** aren't recoloured; only their captions follow the mood.
3. **A colour the teacher picked by hand** for one scene stays when the mood changes (the person's choice wins). **Reset colours to mood** puts it back.

### Look and feel acceptance checks
- [ ] Five people shown the Start screen next to three popular "AI video" tools pick out Stone Age as "hand-made / friendly", not "AI tool" (4 of 5).
- [ ] Every text-and-background pair in both app themes meets WCAG AA contrast (4.5:1 body, 3:1 large text), and every caption in every mood meets the projector rule.
- [ ] The same project exported in Bright, Earthy and Soft changes only backgrounds, captions and word-art; the caveman, props and timing are identical.
- [ ] On a classroom projector from 8 m, a tester can read every caption in the six template example videos.
- [ ] Fonts, textures and icons all load with the network off.

## Features and Behavior
Source: `scope.md > The Core Loop`, `scope.md > The Scope`. Each feature lists **what the person sees → does → gets back**, its **states**, **edge cases**, and **acceptance checks**. Headings F1–F16 are stable addresses for `4-spec` and `5-build`.

### F1 — App load & offline readiness

**Sees:** The Start screen. A thin strip under the header: "Getting ready for offline… N%", then "✓ Works offline — you can disconnect anytime" (fades after 5 s). An **Install app** button in the header on browsers that support it.

**Does:** Nothing required. Optionally installs the app.

**Gets back:** An app that opens and works fully without internet afterwards (voices excepted until downloaded).

**States**

| State | What shows |
|---|---|
| First load, online | Start screen + readiness strip with % |
| Ready offline | "✓ Works offline" once, then a small green **Offline-ready** dot in the header |
| Offline, ready | Header pill "Offline" (grey, calm). All features work. |
| Offline, never finished first load | Browser's own "no internet" page — out of our hands; the README and site say "open once while online" |
| Update available | Small banner: "A new version is ready — Reload" (never auto-reloads while editing) |
| Storage blocked (private window / school policy) | Yellow banner: "This browser won't let HeyCaveman save. Your video will work, but projects vanish when you close the tab. Use **Save project file** to keep your work." |
| Low device storage | Banner when space is under ~200 MB: "Your device is almost full — saving might fail." |

**Edge cases**
1. **Load interrupted halfway** → next visit resumes getting ready; never a broken half-offline app.
2. **Old browser** (no offline support) → app works online only; one-time note "This browser can't keep HeyCaveman offline. Chrome or Edge can."
3. **Update while a project is open** → current work is saved first; the update applies on next reload.

**Acceptance**
1. After the strip says "Works offline", turning off Wi-Fi and reloading opens the app fully, and a video can be made and exported.
2. First meaningful screen shows within 2 s on a mid-range school Chromebook on a normal connection.
3. Total first download (excluding voices) is under 15 MB.
4. With network monitoring on, zero requests go to any domain other than the one serving the app.

---

### F2 — The Start screen (first screen)

*Answers: "When someone opens HeyCaveman for the very first time, what's on the first screen, and how is it arranged?"*

**Layout (top to bottom, one column, centred, max ~720 px wide):**

1. **Header bar** — left: caveman logo + "HeyCaveman · Stone Age". Right: offline status dot, **My videos**, **Install app** (when available), **⋯ menu** (Settings, About, Help).
2. **Headline** — "Turn your lesson into a cartoon video." Sub-line: "Free · works offline · no sign-up · nothing leaves your device."
3. **Three start tabs** above one big text box:
   - **✏️ Write it** (default) — big text box, placeholder: "Paste or type what the caveman should say. One idea per sentence works best." Live counter under it: "84 words · about 35 seconds".
   - **💡 Start from a topic** — opens the Lesson Builder (F3.2) in place of the text box.
   - **📋 Use a template** — shows the 6 template cards (F3.3) in place of the text box.
4. **"Try an example"** text link under the box — fills a ready-made school example (e.g. "Why do we feel sleepy after lunch?").
5. **Shape picker** — three big cards: **Wide** (classroom / YouTube, default selected), **Tall** (Reels / Shorts / phone), **Square** (posts).
6. **Primary button** — **Make my video ▶** (big, full width on small screens). Disabled with hint "Write at least one sentence" when the box is empty.
7. **Small print row** — "Made by HeyCaveman · Open source · Want AI writing & art? See HeyCaveman →" (hidden in Classroom mode, F16).

**Rules**
1. No pop-up, cookie banner, tour or sign-up on first load. The first thing a person can do is type.
2. Whatever is typed is kept if they leave and come back (draft auto-saved).
3. Returning users with projects land on the same screen, with a **Continue: "Photosynthesis"** chip above the headline.

**Edge cases**
1. **Box has only a few words, no full stop** (e.g. "volcanoes") → pressing Make switches to the Lesson Builder with "volcanoes" filled in as the topic and a note: "That looks like a topic. Fill in what the caveman should say about it." Never makes an empty or one-word video.
2. **YouTube or other link pasted** → see F3.4.
3. **Very long text** (over 1,500 words / ~10 min) → counter turns orange: "That's about 10 minutes. Videos under 3 minutes hold attention best — and long ones take a while to export." Still allowed up to 3,000 words; beyond that the box stops accepting more with a clear message.
4. **Pasted text with bullets, numbers, emojis, headings** → cleaned: bullets become sentences, emojis kept in captions only if the font can draw them, otherwise removed.
5. **Non-English text** → allowed; captions show it; built-in voice note: "Voices speak English best. Try recording your own voice."

**Acceptance**
1. A new visitor can start typing within 1 click (the box is focused on desktop).
2. Five test users who have never seen the app produce a video from the example without help.
3. Every element listed above is reachable by keyboard in a sensible order.

---

### F3 — Lesson input

#### F3.1 Write it
As in F2. One sentence ≈ one beat. Blank lines are treated as scene breaks (lets teachers control scenes without an editor).

#### F3.2 Start from a topic — Lesson Builder
*Stone Age has no AI, so "just say the topic" becomes a fill-in-the-blanks builder that turns a topic into a good script.*

**Sees:** Topic field at top, then labelled blanks, each with an example in grey:

| Blank | Example (grey hint) | Required |
|---|---|---|
| Topic | "Photosynthesis" | yes |
| Hook question | "Ever wondered how a plant eats without a mouth?" | no — auto-made from topic if empty ("Ever wondered about photosynthesis?") |
| Key point 1–3 (add up to 5) | "Leaves catch sunlight." | at least 1 |
| Everyday example | "That's why plants lean towards the window." | no |
| One-line recap | "Sunlight + water + air = plant food." | no |
| Quiz question + answer | "What gas do plants breathe in?" / "Carbon dioxide" | no — adds a Quiz scene (F12) |

**Does:** Fills blanks → **Make my video**. Or **Turn into text** to see the full script in the Write box and edit freely.

**Gets back:** A script in a proven explainer order: hook → points → example → recap → quiz → outro.

**Footer note (not in Classroom mode):** "Want the caveman to write this for you? HeyCaveman can research and write it →"

**Edge cases:** Only topic filled → Make stays disabled, hint "Add at least one key point." Very long blanks (over 60 words) → gentle hint "Short sentences read better on screen" (not blocked).

#### F3.3 Templates
Six cards, each pre-fills the Lesson Builder with the right blanks and examples:

1. **Explain a concept** (science, maths)
2. **Tell a story from history** (who, when, what happened, why it matters)
3. **Step-by-step process** (how something works / how to do something, numbered steps)
4. **Word of the day** (word, meaning, use in a sentence, quiz)
5. **Myth vs fact** (myth, why people believe it, the fact)
6. **Book / chapter summary** (title, characters, 3 events, lesson)

**Acceptance:** Every template, filled only with its grey examples, produces a watchable video of 30–90 s.

#### F3.4 Links (YouTube and others)
Stone Age is offline, so it can't read videos or web pages.

**Sees, when a link is pasted:** A friendly card replacing nothing (the link stays in the box): "Making videos from YouTube links needs the internet, so it's a HeyCaveman feature. In Stone Age, paste the video's transcript or your own notes instead." Buttons: **Remove link** · **What's HeyCaveman?** (Classroom mode: only Remove link, plus "Paste your notes instead").

**Edge case:** Link inside a longer text → the link is removed from what the caveman says, and a small note says so.

---

### F4 — Meet your caveman (character setup)

*Answers: "Where and when does 'set your character up once' happen, and what does the person do?"*

**When:** The **first time** someone presses **Make my video** — a sheet slides up before making starts. It never appears again on its own. Later it's always reachable from the **caveman avatar** in the header and from the editor.

**Why then:** The person has already committed (they wrote something), so it feels like part of making, not a sign-up wall. People who just want to look never see it.

**Sees:**
1. Title: "Meet your caveman — they'll star in all your videos."
2. **Four presets** as large tappable cards, drawn live: *Cavey* (classic stick figure, blue shirt — default), *Teacher* (cartoon, lab coat, glasses), *Student* (cartoon, hoodie), *Storyteller* (cartoon, kurta, beard).
3. **Customise** (collapsed by default) with live preview that waves when anything changes:
   - Style: Classic / Cartoon (+ locked Countryball & Blob cards with "In HeyCaveman" — hidden in Classroom mode)
   - Skin tone (6 swatches)
   - Clothes: T-shirt, hoodie, formal, kurta, dress, lab coat (cartoon only)
   - Clothes colour, trousers colour (8 swatches each)
   - Hair (none, short, spiky, long, bun, curly) + hair colour (cartoon only)
   - Glasses (none, round, square); facial hair (none, moustache, beard)
   - Head size (slider, small → big)
   - **Name** (optional, e.g. "Mr. Rao") — used in the end card ("Explained by Mr. Rao")
4. Buttons: **Use this caveman** (primary) · **Skip — use Cavey**.

**Gets back:** A saved "My caveman" used for every new video. Each project also keeps its own copy, so changing "My caveman" later doesn't secretly change finished videos.

**Rules**
1. Takes under 15 seconds with a preset; zero required choices.
2. Changing the caveman inside one project asks: "Just this video, or make this my caveman for new videos too?"
3. No photo-face option in Stone Age (children's privacy).

**Edge cases**
1. **Storage blocked** → choice lasts this session only; no error shown beyond F1's banner.
2. **Opening an old project file** with a design that has a premium style (ball/blob) → shows as Cartoon in Stone Age with a note "This video's caveman uses a HeyCaveman style; showing the closest free one." The original choice is kept in the file, untouched.
3. **Classic style + clothes options** → clothes options greyed out with hint "Cartoon style wears clothes."

**Acceptance**
1. First Make shows the sheet exactly once per device; Skip still makes the video.
2. The chosen caveman looks identical in every scene of every new video.
3. Changing "My caveman" never changes an already-made project unless the person chose that.

---

### F5 — Video shape

**Sees:** Wide / Tall / Square cards on Start, and a shape switch in the player toolbar.

**Rules:** Wide is default (projectors, YouTube, smart boards). Switching shape after making re-arranges every scene (bigger central caveman and phone-safe margins in Tall) without losing edits to text, captions or voice.

**Edge case:** Props placed by hand near an edge → kept inside the frame after a switch; never cut off.

**Acceptance:** The same project exported in all 3 shapes has no caption, prop or character cut off at the edges.

---

### F6 — Make (the offline director)

**Sees:** A progress screen with a looping caveman animation and plain-language steps that tick off:
1. "Reading your lesson…"
2. "Planning N scenes…"
3. "Setting the stage…"
4. "Adding voices…" (only if voices are ready, see F10)

**Does:** Waits (target under 5 s before voices; voices ~1–2 s per scene on a Chromebook). Can press **Cancel** any time.

**Gets back:** A playable video, made from the text with these rules (what a person would notice):
1. **Scenes:** roughly one idea per scene; very short sentences join their neighbour, very long ones split. Blank lines force a new scene.
2. **Caveman acting:** motion and face fit the words (a question → thinking/shrug; "but", "wrong" → disagree; "great", "yay" → celebrate; numbers/steps → explain/point).
3. **Props & places:** drawings that match words in the sentence ("plant", "sun", "money", "school"); the background setting stays the same until the story moves somewhere new.
4. **Captions:** big bold key words, not full paragraphs; numbers and equations shown as colourful word-art ("CO₂ + H₂O → food").
5. **Sound effects:** a pop when a prop appears, a whoosh on scene change, a ding on a key fact — gentle, not constant.
6. **Opening:** first scene is the hook, title card shows the topic; last scene is an end card (F13).
7. **Timing:** each scene lasts as long as its voice; without voice, as long as reading the caption comfortably takes.

**States**

| State | What shows |
|---|---|
| Making | Progress steps |
| Done | Player (F7) with a one-time tip: "Tap any scene to change it." |
| Cancelled | Back to Start, text untouched |
| Nothing matched a prop | Scene uses caveman + caption + a plain coloured background — never an empty or broken scene |
| Something failed | "The caveman tripped. Your text is safe — try again." + **Try again**; details hidden behind "Show details" for bug reports |

**Edge cases**
1. **Same text twice** → same video (predictable; teachers can rely on it). A **Shuffle** button in the player re-rolls props/poses for variety.
2. **Text full of names/jargon** with no matching drawings → caption-led scenes; the person can add props in editing.
3. **Re-make after editing the text** → asks "Re-make the whole video? Your scene edits will be replaced." with **Re-make** / **Keep my edits**.

**Acceptance**
1. Each of the 6 templates' example scripts makes a video where at least 70% of scenes have a relevant prop or background (judged by 3 reviewers).
2. No scene ever has caption text cut off, overlapping the caveman's face, or off screen.
3. Making works identically with the network off.

---

### F7 — Watch (the player)

**Sees:** The video in the chosen shape, a big play/pause, a scrub bar with scene markers, current time / total, and a row of **scene thumbnails** below. Toolbar: shape switch, **Colour mood** (Bright / Earthy / Soft, see Look and Feel > Inside the video), **Shuffle**, **Voice** (F10), **Edit** (F9), **Download video** (F13), **Save** (F14).

**Does:** Plays, scrubs, taps a thumbnail to jump, taps the picture to pause. Keyboard: Space play/pause, ←/→ previous/next scene.

**Rules:** What plays here is exactly what the exported file will look and sound like. Full-screen button for projecting in class.

**Edge cases:** Audio blocked until a click (browser rule) → first press of Play starts sound; no error. Slow device → may skip frames in preview but the exported file is always smooth.

**Acceptance:** A 2-minute video plays start to end in full screen on a school Chromebook without stopping; voice stays in sync with the caveman's mouth within a blink.

---

### F8 — Quick scene edits (tap a scene)

**Sees:** Tapping a scene thumbnail opens a side panel (bottom sheet on small screens) for that scene only:
1. **Words** — what the caveman says (changing it re-does that scene's voice and caption timing only).
2. **Caption** — the on-screen key words + style (bold yellow, bold red, plain white, outlined).
3. **Caveman** — action (16 motions as small animated chips) and face (6 expressions); hide caveman for this scene.
4. **Background** — colour swatches or a setting drawing.
5. **Props** — current props with remove; **Add prop** opens the library (F9.3).
6. **Sound** — pick/none from the 10 effects, with preview.
7. Scene actions: **Duplicate**, **Delete**, **Move earlier / later**, **Add scene after**.

**Rules:** Every change shows instantly in the player. **Undo / Redo** (Ctrl+Z / Ctrl+Y and buttons), at least 50 steps.

**Edge cases:** Deleting the only scene → blocked: "A video needs at least one scene." Deleting a scene with a recorded voice → "This scene has your recording. Delete anyway?"

**Acceptance:** A teacher can change one scene's prop, caption and caveman action in under 30 seconds without opening the full editor.

---

### F9 — Editor (more control)

For people who want to arrange things by hand. Same project, more panels.

1. **F9.1 Scene list / timeline** — all scenes in order with duration; drag to reorder; set each scene's length (when it has no voice).
2. **F9.2 Stage** — drag props and the caveman to move, corner handles to resize/rotate; snap guides keep things centred; set when a prop appears/disappears within the scene.
3. **F9.3 Prop library** — searchable grid of the bundled drawings, grouped (people & body, school, science, nature, food, money, home, travel, symbols & arrows, settings/backgrounds). Search matches names and tags ("lungs" finds body drawings). End of list (not in Classroom mode): "Need more pictures? HeyCaveman searches millions of free ones →".
4. **F9.4 Captions** — multiple captions per scene, each with its start/end within the scene and a style.
5. **F9.5 Character** — opens the caveman designer (F4) for this project.
6. **F9.6 Upload your own picture** — a teacher can add a picture from their device (diagram, map, photo) as a prop or background. It stays inside the project; never uploaded anywhere. Limit ~5 MB per picture with a clear message.

**Edge cases:** Uploaded image too big → automatically shrunk; if that fails, "This picture is too large; try a smaller one." Unsupported file → "Use PNG, JPG, WebP or SVG."

**Acceptance:** Someone can build a 3-scene video from scratch (no script) in the editor: set backgrounds, add props, write captions, play it.

---

### F10 — Voice

**Three choices, picked per video (and changeable per scene):**

| Option | What it is | Notes |
|---|---|---|
| **Caveman voices** | A choice of natural built-in voices (male/female, US/UK accents, Hindi-English when available), speed slow/normal/fast, with a "hear sample" button | Needs a **one-time download** (~90 MB). After that, fully offline. |
| **Record my voice** | Record each scene's line with the device microphone; re-record any scene | Best for students' projects and non-English lessons. Recording stays on the device. |
| **No voice** | Captions + sound effects + optional gentle background beat (bundled) | Silent classroom display, or reading practice. |

**Voice download flow**
1. First time someone picks Caveman voices (or after their first video, a card: "Give your caveman a voice — one-time 90 MB download, then works offline"), they see size and **Download voices** / **Not now**.
2. Progress bar with %; can keep editing meanwhile; pausing/losing internet resumes later.
3. When done: "✓ Voices ready — adding them to your video" and the current video gets voiced automatically.

**Record-my-voice flow**
1. Asks microphone permission (the browser's own prompt) only when **Record** is pressed.
2. Shows the scene's line as a teleprompter, 3-2-1 countdown, live level meter, **Stop**, then **Play back / Re-record / Keep**.
3. Scene length adjusts to the recording; the caveman's mouth moves with it.

**States & edge cases**
1. **Device too weak / phone** for built-in voices → option shows "Not available on this device — try Record my voice" (no failed attempts, no long freezes).
2. **Download fails or school network blocks it** → "Couldn't download voices (the network may block large downloads). Try another network, or record your voice." No retry loop.
3. **Mic denied** → "HeyCaveman can't hear you. Allow the microphone in your browser settings." with a picture of where.
4. **Recording too quiet / silent** → "We couldn't hear anything — check your mic" before keeping it.
5. **Recording over 60 s for one scene** → stops automatically with a note; suggests splitting the scene.
6. **Mixed voices** (some scenes recorded, some built-in) → allowed; each scene shows a small icon of its voice type.
7. **Words edited after voicing** → that scene shows "Voice out of date — redo" (built-in: one tap; recorded: re-record prompt).

**Acceptance**
1. With voices downloaded and the network off, a new video gets voiced end to end.
2. A recorded scene exports with its recording in sync with the caption.
3. The device's own speech voices are not offered (they can't be put into the exported file — avoids a "preview has voice, video doesn't" surprise).

---

### F11 — Sound effects

**Sees:** Per scene in F8 (one main effect) and per prop in the editor (pop on appear). Global switch in the Voice panel: **Sound effects: On / Gentle / Off**. Default *Gentle* for education (fewer, quieter effects than premium's "viral" mix).

**Acceptance:** With effects Off, the export has no effects; with Gentle, effects never drown out the voice.

---

### F12 — Education extras

1. **Title card** — first scene shows the topic big, with the caveman waving (from the Lesson Builder topic or the first sentence). Can be turned off.
2. **Quiz scene** — shows the question, a "Think…" countdown (3–10 s, adjustable), then reveals the answer with a ding. Optional multiple-choice (2–4 options; the right one highlights on reveal).
3. **Recap scene** — the recap line as bold word-art with the caveman pointing.
4. **Key-word captions** — captions highlight the important word in a different colour (automatic; editable).
5. **Pause points** — teacher can mark a scene "pause here": in the in-app player (classroom projection) the video stops after that scene for discussion; the exported file instead holds the scene 3 s longer.
6. **Reading speed** — slow / normal / fast, affects caption-only timing and voice speed (helps younger classes).

**Edge cases:** Quiz with no answer → reveal step skipped, shows "Discuss!" instead. Multiple-choice with the right answer not marked → Make warns "Pick which answer is right."

**Acceptance:** A teacher can add a 4-option quiz to the end of a video and export it in under 1 minute.

---

### F13 — Download video (export)

**Sees:** **Download video** → a small panel: Quality **Standard (720p — faster, smaller)** / **HD (1080p)**, end card toggle, **Start**. Then a progress bar with time left, the caveman pushing a stone wheel, and **Cancel**.

**Gets back:** An MP4 file named after the video ("photosynthesis-heycaveman.mp4") saved to the device's downloads. Then a done card: **Open file location** (where the browser allows) / **Make another** / **Save project file too**.

**End card** — last 3 s: "Made with HeyCaveman · free at [site]" + the caveman waving + the person's caveman name if set ("Explained by Mr. Rao"). **On by default, can be switched off** (it's open-source; we ask, not force). Copy under the toggle: "Keeping this helps other teachers find HeyCaveman."

**States & edge cases**
1. **Supported browsers (Chrome, Edge, recent desktop browsers)** → exports on device, offline.
2. **Browser can't make video files** (some Safari/Firefox versions, many phones) → button explains before starting: "This browser can't make video files. Open HeyCaveman in Chrome or Edge, or save the project file and export on a computer." Never a failed export after waiting.
3. **Tab hidden or device sleeps during export** → export pauses and continues when back; message "Keep this tab open while your video is made."
4. **Running out of memory / very long video** → fails gracefully: "This video is too long for this device. Try Standard quality or split it." Work is never lost.
5. **Cancel** → stops within 2 s; no partial file.
6. **Export while voices out of date** → asks "Some scenes' voices are out of date. Update them first?" (Update / Export anyway).

**Acceptance**
1. A 1-minute 720p video exports in under 2 minutes on a mid-range school Chromebook, offline.
2. The exported file plays in common players (Windows Photos, VLC, phone galleries, WhatsApp, YouTube upload) with sound in sync.
3. What's in the file matches the preview frame for frame (spot-check 10 frames).

---

### F14 — My videos (saving & files)

**Sees:** **My videos** page: cards with a thumbnail, title, length, "edited 2 days ago". Actions per card: **Open**, **Rename**, **Duplicate**, **Save as file**, **Delete**. Top: **New video**, **Open a file**. A storage meter: "Using 120 MB on this device".

**Rules**
1. **Auto-save** every change; there is no "unsaved" state. Title comes from the topic/first sentence; rename anytime.
2. **Project file** ("photosynthesis.caveman") holds everything: text, scenes, caveman, recordings, uploaded pictures. Opening it on another device restores the exact video. The same file opens in HeyCaveman premium.
3. **Delete** asks once; deleted projects go to **Recently deleted** for 30 days (then gone). Nothing on the device is deleted without the person choosing it.
4. A warning on first save: "Videos are saved in this browser only. Clearing browser data removes them — use Save as file to keep a copy."

**Edge cases**
1. **Opening a file from a newer version** → opens what it can; note "Made with a newer HeyCaveman — some parts may look different. Reload to update."
2. **Opening a premium file** with premium looks/art → the scenes open with a free fallback look (doodle drawings, plain background) and a banner: "This video uses HeyCaveman looks. Showing a Stone Age version — the original stays in the file." Saving keeps the premium parts untouched.
3. **Damaged or wrong file** → "This isn't a HeyCaveman project file."
4. **Two tabs editing the same project** → the second tab shows "Open in another tab" and becomes read-only until reloaded.
5. **Storage full** → saving stops with a clear banner and a one-click **Save as file** so nothing is lost.

**Acceptance**
1. Closing the browser mid-edit and reopening restores the last change.
2. A project file saved on one computer opens identical on another, offline.
3. A Stone Age file opens in HeyCaveman premium with no loss.

---

### F15 — The bridge to HeyCaveman (premium)

**Where premium appears (and only here):**
1. Lesson Builder footer (AI writes it).
2. Link pasted (F3.4).
3. **More looks** shelf in the player toolbar — preview images of Storybook, Cinematic, Illustrated, Diagram looks, each marked "HeyCaveman".
4. Locked mascot styles in F4.
5. End of the prop library (F9.3).
6. ⋯ menu → **About HeyCaveman**.

**"Open in HeyCaveman" handoff:** Saves the current project file, opens heycaveman.com in a new tab with an import screen, the person drops the file in (or it's carried over automatically where the browser allows), and the same video appears there. A launch discount code is shown for HeyCaveman — this is also how we count Stone Age-driven sales.

**Rules**
1. Never a pop-up, timer, nag counter, watermark-as-punishment or blocked feature that used to work.
2. Every premium mention has a dismiss (×) that's remembered.
3. **Classroom mode** (F16) hides all of the above except About.
4. Premium mentions are clearly labelled as from HeyCaveman, the company behind the project.

**Acceptance:** A tester counts premium mentions during a full make-edit-export run: at most 2 visible without them clicking to explore.

---

### F16 — Settings, help & about

1. **Classroom mode** — hides premium mentions, the small-print upsell row and locked items; locks the end card ON (school-friendly credit) or OFF (teacher's choice); can be pre-set by a link (e.g. `…/?classroom`) so a teacher can share a clean version with students.
2. **Defaults** — default shape, colour mood, voice, speed, sound-effects level, end card on/off, reading speed.
3. **Appearance** — app theme: Light (default), Dark, or Match my device (Look and Feel > The app around the video).
4. **My caveman** — opens F4.
5. **Storage** — space used, **Delete voices** (frees ~90 MB), **Delete all projects** (double-confirm).
6. **Help** — short illustrated guide (works offline), keyboard shortcuts, "Video won't export?" troubleshooting.
7. **About** — version, open-source licence, credits for bundled art and sounds, link to the code repository, privacy promise ("No account. No tracking. Your lessons never leave your device."), About HeyCaveman.
8. **Report a problem** — opens a pre-filled issue on the code repository (only when the person clicks; shows what will be shared first; no automatic crash reports).


## States and Boundaries
Cross-cutting states. Per-feature states live in each F-section above.
- **First use:** no project, no caveman set. Start shows the empty text box and Try an example. The caveman sheet appears on the first Make only (F4).
- **Normal use:** the draft auto-saves; returning users see **Continue: "<title>"** above the headline (F2).
- **Empty My videos:** the caveman with "No videos yet. Make your first one!" (Look and Feel > Words).
- **Offline:** everything works after the first load; the header pill says "Offline" (F1).
- **Storage blocked or full:** banners, plus a one-click **Save project file**, so nothing is lost (F1, F14).
- **Errors:** plain words plus what to do next, no codes. Details sit behind "Show details" (F6, Non-Functional > Reliability).
- **What persists:** projects, My caveman, settings and downloaded voices persist on this device's browser. Recently deleted projects are kept for 30 days. Nothing persists on any server.
- **Permissions:** the microphone is used only while Record is active (F10). There are no accounts, so everyone can do everything on their own device.
- **Classroom mode:** hides every premium mention except About (F16, F15).

## Non-Functional Requirements

### Devices and browsers
| Tier | Devices | Expectation |
|---|---|---|
| **Must work fully** | Chrome / Edge (latest two versions) on Chromebook, Windows, Mac, Linux, 4 GB RAM or more | Everything, offline |
| **Should work** | Firefox, Safari desktop | Everything except possibly export (F13 edge case 2) and built-in voices |
| **Best-effort** | Phones and tablets | Write, make, watch, edit, record voice, save file. Built-in voices and export only where the device can. |

### Performance budgets
1. **First screen:** under 2 s on normal broadband; the app download (no voices) is under 15 MB.
2. **Make (before voices):** under 5 s for a 300-word script.
3. **Preview:** smooth (no visible stutter) on a 4 GB Chromebook for Wide 720p.
4. **Export:** a 1-minute 720p video in under 2 minutes on that Chromebook.
5. **No freezing:** typing and editing never freeze the screen, even during voice generation or export.

### Privacy and child safety
1. **No accounts, no email, no names required.** The caveman name is optional and stays on the device.
2. **No tracking:** no analytics, cookies, fingerprinting or third-party requests inside the app.
3. **Microphone** only while the Record button is active, with a visible "Recording" indicator.
4. **Kid-safe art:** all bundled drawings are reviewed for classroom suitability (no alcohol, weapons, gore, romance, or political or religious symbols except neutral educational ones). The review checklist is part of each release.
5. **School-ready:** suitable for under-13s and able to pass a typical school IT review. A one-page "For schools" privacy sheet ships in the repo and on the site.

### Accessibility
1. **Keyboard:** full keyboard use, visible focus, and screen-reader labels on every button and thumbnail.
2. **Contrast:** WCAG AA in the interface; caption styles in the video meet AA against their background.
3. **Captions on by default:** every video is watchable without sound.
4. **Reduce motion** is respected in the interface (the video itself still animates).
5. **Zoom:** text can be enlarged to 200% without breaking the layout.

### Reliability
1. **No action loses work:** auto-save, Recently deleted, and a file save offered whenever storage fails.
2. **Plain-language errors:** every error message says what happened and what to do next, with no codes in the main message.

### Language
The interface is English in v1, with all text kept translatable so volunteers can add languages (Hindi first, by demand). Captions accept any language the font can draw.

## Product Decisions
The learner's choices, from their PRD's principles and open-question defaults:
- **Offline after the first load:** every feature works with the network unplugged (the one-time voice download excepted). This is the whole product's promise.
- **Nothing leaves the device:** no account, analytics, cookies or third-party requests, ever. That's how a school can approve it.
- **Safe for a classroom:** no ads, no external images, no surprising links, and age-appropriate art.
- **Same file, bigger world:** a Stone Age project opens in HeyCaveman premium unchanged, so upgrading never means starting over.
- **Honest upsell:** premium appears only where it naturally helps, never as a pop-up, and can be hidden entirely (Classroom mode).
- **One button to a video:** a first-time user gets a finished video without touching any setting.
- **No AI in Stone Age, and no bring-your-own AI key** (Q4): AI writing is the #1 upgrade reason, and the Lesson Builder replaces "just say the topic".
- **Licence** (Q1): the app under **AGPL-3.0**, drawings and sounds under **CC0**. It protects against quiet resale while letting schools reuse the art. (It meets the hackathon's open-source licence rule.)
- **Separate public repo** (Q5): no premium code ever leaks. Premium looks, art packs, AI, servers, payments and accounts are never in this repo, not even switched off.
- **Mascot styles** (Q2): Classic and Cartoon are free; Countryball and Blob are premium.
- **End card** (Q3): on by default and removable ("we ask, not force").
- **App look** (Q7): cave-paper (warm paper, charcoal ink, ochre buttons, rounded type), not premium's purple brand. It gives Stone Age its own identity, and premium can adopt it later.
- **Default video mood** (Q8): Bright, because it reads best on classroom projectors; Earthy and Soft are one tap away.
- **Brand:** "HeyCaveman" and the caveman logo are trademarks, so forks must rename. Stated in the README.
- **Self-hosting:** works the same from a school intranet, a USB stick or a local server.
- **Wide 16:9 is the default shape,** because classrooms project wide.

## What We're Building
The complete Stone Age product, in this order (`scope.md > The Scope`). Each milestone ends finished and tested before the next starts; if time runs short, cut from the bottom.
1. **M1 Cut:** the app runs fully on the device. Start screen (F2), Write it (F3.1), offline readiness (F1), Make (F6), Watch (F7), MP4 export without voice (F13), My videos (F14). **Exit:** works offline end to end on a Chromebook.
2. **M2 Teach:** Lesson Builder (F3.2), 6 templates (F3.3), link handling (F3.4), Meet your caveman (F4), video shape (F5), quiz, recap and title cards (F12), gentle sound effects (F11), quick scene edits (F8), colour mood (Look and Feel), Classroom mode (F16). **Exit:** 5 teacher testers each make a lesson video.
3. **M3 Voice:** voice download, record-my-voice, mixed voices, voice out of date (F10). **Exit:** a voiced export works offline.
4. **M4 Polish and open:** the Editor (F9) and picture upload (F9.6), the accessibility pass, the kid-safe art review, Settings, Help and About (F16), the For-schools sheet, licence, README and contributor guide. **Exit:** every acceptance check in Features and Behavior passes, then public launch.
5. **M5 Bridge:** the "Open in HeyCaveman" handoff, a launch discount code, and the More looks shelf (F15). **Exit:** a Stone Age file opens in premium with no loss.

## Deferred From the POC
Nothing is deferred within Stone Age; the build order above is the safety net. The premium features are deliberately not built here (see Non-Goals).

## Possible Later Enhancements
- **Interface languages beyond English,** Hindi first, by volunteer translation.
- **Teacher dashboards, class rosters and assignments,** as a possible future premium feature.
- **Phones as a first-class device,** if usage shows demand.

## Non-Goals
- **AI writing or research, YouTube-link videos, Storybook and other looks, art packs, Countryball and Blob mascots, multiple characters per video, online photo and prop search, cloud saving:** these are HeyCaveman premium, the upgrade reasons.
- **Photo face on the character:** children's privacy.
- **Sharing links or hosting videos:** Stone Age makes a file; people share it however they like.
- **The device's own speech voices:** they can't be put into the exported file, so they'd create a "preview has voice, video doesn't" surprise.
- **Any server, analytics or automatic crash reports:** this would break "nothing leaves the device".
- **The generic AI-app look:** see Look and Feel > Avoid.

## Success Metrics (measured without tracking users)
| Goal | Metric | Target (90 days after launch) | How measured |
|---|---|---|---|
| Reach | Repository stars | 1,000 | Repo page |
| Reach | Monthly visits to the official site | 10,000 | Host's aggregate request logs only (no in-app tracking) |
| Reach | Videos with the end card seen online | 300 links found | Search and social listening for "Made with HeyCaveman" |
| Quality | First-time testers who finish a video unaided | ≥ 80% (of 10 testers per release) | Moderated tests |
| Quality | Open bugs tagged "lost work" | 0 | Repo issues |
| Funnel | Click-through to heycaveman.com from the app | 2–4% of visits | Visits arriving with the Stone Age referral tag (only when the person clicks) |
| Education | Schools and teachers who self-report use | 25 | A "Used it in class? Tell us" issue template or form on the site |

## Open Questions
- **Premium import screen (F15, M5)** depends on heycaveman.com having an import screen that accepts a Stone Age project file. *Can wait:* M5 is last; if it's not ready by the deadline, M5 ships the More looks shelf and the code without the automatic handoff.
- **Video caption font:** chosen in `4-spec` (Look and Feel > Inside the video). *Belongs to `4-spec`.*
- **Built-in voice size and quality (~90 MB, Hindi-English "when available"):** whether a suitable offline voice exists at that size is a `4-spec` question. *Belongs to `4-spec`;* the product behavior above stays the same.
- **Bundled art (~280 drawings) and 10 sound effects:** these must be fresh, original or properly licensed (CC0) for this repo, since no old code or assets may be reused without disclosure. *Must be planned in `4-spec`.*
