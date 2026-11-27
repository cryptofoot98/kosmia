# Stage 6 — Final visual fidelity audit

**Date:** 28 October 2026

**Reference:** the eight mockup boards in `docs/mockups`.

**Method:** every screen was opened in WebKit (the Safari engine) at the board's phone size, 390×844, and set side by side with its mockup. Differences were listed by priority and fixed, then the screen was captured again. Each final comparison is in `docs/review/final-<screen>.webp`. It shows three columns: the mockup, the app before Stage 1, and the app now. The per-stage comparisons (`stage2-*` to `stage5-*`) record the steps in between.

These are side-by-side visual comparisons, not pixel overlays. The app shows live data (today's Moon, your forecast, the real upcoming events), so the words and numbers differ from the mockups' examples by design.

## 1. Screen-by-screen

| Screen | Composition vs mockup | Remaining differences |
|---|---|---|
| Home | Wordmark, tagline, bell, avatar and greeting over the starry sky. The sign figure sits before its golden halo, in front of the forecast card, clipped at the text edge. Five insight tiles, the Daily Whisper beside its card, the Cosmic Energy landscape, events, Explore, Recent Readings, the Kassandra banner and the closing sun. | P1: the Whisper painting is the older pale style, not the mockup's navy "The Star". P2: the header is about 8% taller than the mockup's because the card text is ≥12.5px (the mockup's is about 9px), so Cosmic Energy starts below the first screen. P2: the tile icons are the app's existing medallion icons, kept as Stage 2 asked. P2: the avatar is the sign medallion until photo upload exists. |
| Horoscope hub | Sun, crescents and coast panorama; period tabs; the energy panel with the Moon in a rose arch; gilt tiles; your sign; every sign. | P2: the tile icons sit in dark medallions, where the mockup has free-standing engravings. |
| Libra / Capricorn / other signs | A framed arch for each sign with its glyph medallion, the keywords, the intro, the tabs, and the reading with tinted Key Theme rows. | None at P0 or P1. |
| Tarot hub | The arched night scene with the tarot card and lilies, and a gilt panel with the four ways in. | None at P0 or P1. |
| Daily Whisper (the mockup's "Daily Card") | A large gilt card numbered with its name on a plate, the keywords, the message, Write Your Reflection, Share and Save. | P1: the Whisper painting style (as on Home). The mockup shows tarot's "The Star"; the app's daily card is one of its 100 Whispers. |
| Journal list | The Moon over the lake, a serif title, search and new entry, filters and rows with thumbnails. | P2: the mockup shows four filters; the app has six (Dreams and Connections exist in the app). |
| Journal editor | Save in the header, the card in a gilt frame, the writing pane with a toolbar, prompts and intentions. | P2: the toolbar inserts list, quote, star, time and break marks instead of bold, italic and underline. The reflection is stored as plain text, and changing storage was out of scope. |
| Journal calendar | A gilt frame, gold-ruled grid, a Moon under every day, and that day's entries. | None at P0 or P1. |
| Journal insights | The sun-and-moon band, the serif title, gilt stat cells, framed theme icons and coloured bars. | None. |
| Discover | The crescent, star, lake and town scene; eight gold-ruled cards, each with its own painting in its own shape; more below. | None at P0 or P1. |
| Birth Chart | The framed sun-wheel plate, intro, View My Birth Chart and four rows; the chart itself is calculated from your birth details. | None. |
| Zodiac Affinity | The sun-and-moon plate, the selectors and the four readings, then the calculated result and the lakeside foot. | None. (The 94% is calculated; the mockup's 86% is an example.) |
| The Name Within / Life Path | The framed plates, the inputs, and the four readings listed and then calculated. | None. |
| Dream Interpretation / New Dream / Dream Meaning | The sleeping woman, the symbols, the input with voice, mood and symbols, and the owl result with its symbol plates. | None. The AI reading needs sign-in, and the page says so. |
| Cosmic Calendar | Month navigation, events with lunar plates, cosmic weather, and the lakeside scene at the foot. | P2: the app keeps its List/Month switch, which the mockup lacks. |
| Astrology Library | Tabs, search and parchment rows with thumbnails. | None. |
| Kassandra | The red-headscarf portrait in an engraved ring of stars, the bubble, the large microphone, the three prompts and the input. | None. |
| Profile | The sign's figure before its moon in the night garden, and a gilt identity card. | No mockup exists for this screen; it is built from the system. |
| Onboarding (8 steps) | Welcome, intro, sign grid of 12 creature medallions, confirmation, account, details, notifications, final scene. | P2: account and details are separate screens; the mockup tucks details after account. |

**Fixed in this stage**
- P1: the mockups' double gold rule down both sides of every screen. Home keeps its own rules on its parchment sheet.
- P2: the Daily Whisper message is now centred.
- P2: a layout jump on Home (layout shift 0.106) as the web fonts arrived. Fixed with sized fallback fonts and an early connection to the font server; the shift is now 0.004–0.005 on every load.
- Heavy images re-encoded (see 4).

**No open P0 issues.** There is no broken navigation, unreadable text, missing hero art, artwork blocking a control, or wrong data.

## 2. Responsive results

All 40 screens were run at each size.

| Viewport | Screens | Script errors | Horizontal overflow | Missing images |
|---|---|---|---|---|
| 360×800 | 40 | 0 | 0 | 0 |
| 390×844 | 40 | 0 | 0 | 0 |
| 430×932 | 40 | 0 | 0 | 0 |
| 768×1024 (tablet) | 40 | 0 | 0 | 0 |
| 320×640 (onboarding and Home) | checked | 0 | 0 | 0 |

- **Smaller screens:** at 360 and 320 the figure on Home stays clear of the forecast text and button. It is clipped at the card's text edge on every sign, checked for all 12.
- **Tablet:** the app keeps its phone-width column (480px) centred on the night background.
- **Safe areas:** headers, the bottom bar and onboarding use `env(safe-area-inset-*)`.
- **Mobile forms:** fields use the correct `autocomplete` values (email, new-password and current-password, name), `inputmode="email"`, and native date and time pickers.

## 3. Functional regression

These ran in WebKit against a local build in local mode.

- **Flow test** (`flows2`), all pass:
  - onboarding (welcome, intro, sign, confirm, details skipped, notifications, ready, Home)
  - Whisper reveal
  - entry autosave, prompts and intentions
  - free write, tear-out and undo
  - blank entry removed
  - offline dream reading
  - affinity
  - tarot reading saved
  - notebook
  - library search
  - horoscope save
  - old links redirect
- **Stage 6 checks** (`func6`), 29 of 29 pass:
  - the five destinations in the bottom bar
  - horoscope period changes the reading; category opens; Key Theme row opens and becomes the main reading
  - tarot reading start; Daily Whisper reveal
  - birth chart: opens on Aspects, wheel drawn from the calculated positions, Back to the intro
  - affinity score calculated
  - name numbers revealed and saved; Life Path number
  - calendar month navigation and month grid
  - journal entry created, then edited
  - horoscope saved and listed in the journal
  - dream reading
  - profile scene personalised; display name saved
  - notification and larger-text settings
  - Kassandra's portrait, microphone and prompts
- **Onboarding test** (`obshot2`):
  - a future birth date is refused
  - name, date and time are saved; notification choices are saved
  - entering the app works, and a returning user goes straight to Home
- **Account form** (dummy project, offline):
  - a weak password and mismatched passwords keep Continue disabled, with a message
  - three met rules enable it
  - show/hide password works; the sign-in form uses `current-password`

**Not testable here**
- Real sign-up, sign-in and cloud sync against the live Supabase project: no test account, and none was created on production.
- Kassandra's live text and voice answers, which need a signed-in account (the OpenAI and ElevenLabs keys are server-side).

The local tests cover the forms and the requests the app sends.

## 4. Performance

Measured in Chromium at 390×844 and 3× pixel density.

| Screen | Images on load | Layout shift | Largest paint |
|---|---|---|---|
| Home | 3.2 MB in 26 images (was 3.7 MB) | 0.005 (was 0.106) | ~1.5 s locally |
| Horoscope | 1.3 MB | 0.024 | 0.3 s |
| Daily Whisper | 0.41 MB (was 0.82 MB) | 0.001 | 0.1 s |
| Discover | 2.3 MB (was 2.8 MB) | 0.014 | 0.15 s |
| Kassandra | 0.25 MB | 0.005 | 0.2 s |
| Profile | 0.92 MB | 0.008 | 0.12 s |

- **Memory:** the JavaScript heap stays between 3 and 15 MB, and pages have 90–250 elements.
- **Scrolling:** Home scrolls at about 130 frames per second in a long programmatic scroll.
- **Animation:** limited to two star layers and one slow ring. They stop under reduced motion, as does the parallax.
- **Images re-encoded:**
  - card back: 566 KB → 156 KB
  - tarot back: 336 KB → 65 KB
  - the two Discover banners: 1100 → 760 px, 320 → 130 KB each
  - 29 other paintings over 250 KB: about 13% smaller each
- **Earlier stages:** the Whisper and deck art went to 720 px (−16 MB).

No visible loss was seen in the comparisons.

**Mobile networks:** Home still loads every image on a phone, because the page is short enough that the browser's lazy-loading window covers it. About 3.2 MB on first visit is acceptable on 4G but heavy on 3G. The largest items are the header sky (384 KB) and the figure (216 KB). A further step, not taken, would be smaller copies served to 2× screens (`srcset`).

## 5. Assets and components changed across the reconstruction

**New paintings** (all made with the project's OpenAI key):
- `home-sky`, `home-halo`, `home-vines`, `home-energy`, `home-sun`
- `fg-<sign>` ×12, cut out
- `hero-horoscope`, `hero-tarot`, `hero-journal`, `hero-insights`, `hero-discover`
- `ce-vignette`, `cal-scene`, `ob-welcome`, `ob-final`
- `zm-<sign>` ×12

**Retired:** `hero-<sign>` ×12 and `sun-panel`.

**Components (`public/kit.js`):**
- scene system: `scene`, `fg`
- `panel`, `frame`, `divider`, `heading`, `pill`, `tarot`, `event`, `feature`, `icon`, `nav`, `page`
- gallery at `/kit.html`

**Design tokens:** the top of `public/styles.css`.

**Inventory:** `docs/asset-manifest.md` (`node scripts/asset-manifest.mjs`).

## 6. Unresolved

1. **Whisper card paintings (P1).** The 100 Whispers are still in the older pale watercolour style; the mockups show navy, starry, gold-framed cards. Repainting is about 100 images, roughly $15–20 on the OpenAI key, and is waiting for the owner's go-ahead. The tarot deck (78) is in the same position.
2. **Profile photo.** There is no upload yet, so the avatar shows the sign medallion.
3. **Notifications.** Choices are saved, but delivery (push) is not built. The app says so.
4. **Database migration** for saving dreams and Kassandra conversations to the account is written but not applied. It needs the owner's approval; until then both are kept on the device.
5. **Live account and Kassandra** end-to-end checks need a signed-in test by the owner.
