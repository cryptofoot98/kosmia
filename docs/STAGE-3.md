# Stage 3 — Horoscope, Tarot and Journal

The reference boards are `docs/mockups/horoscope.webp`, `tarot-journal.webp` and `overview.webp` (for the Daily Card). For each screen there is a mockup / before / after comparison in `docs/review/stage3-<screen>.webp`. The screenshots are 390×844 and use the same seeded data each time.

## What changed

**Section scenes**
- The Horoscope, Tarot, Journal and Insights paintings have been repainted from edge to edge with no frame painted in. Horoscope, Tarot and Journal are square; Insights is a wide band.
- Each scene places its title where its sky is open.
- The Horoscope subtitle and the Journal and Insights titles are set in the mixed-case serif, as in the mockups.

**Horoscope hub**
- The day's energy now sits beside the Moon in a rose-framed arch (`ce-vignette`). Today's painted phase is set inside the arch.
- The tiles are gilt parchment.
- "Your Zodiac Sign" and "Explore Every Sign" sit under ornamental dividers.

**Sign pages**
- Every sign keeps its own arched plate: Libra's woman with the scales, Capricorn's mountain goat, and so on.
- The reading and its Key Themes share one ornate panel, divided by a rule.
- Each theme is a tinted row showing the icon, the area and its phrase:
  - rose for Love
  - green for Health
  - amber for Career
  - sage for Money
  - plum for Family
  - gold for Overall
- Each row still opens to its full reading and can become the main reading.

**Tarot hub**
- The four ways in (Daily Whisper, Card Reading, Your Journal and Reading History) sit on one gilt parchment panel risen over the scene.
- The night, edged with flowers, continues behind the panel.

**Daily Whisper (the Daily Card)**
- The card is a gilt tarot frame: the painting, its number in the deck of 100 on a cartouche, and its name on a plate. The text is live.
- Below it come the keyword pill, the message, the reflection question, and Write Your Reflection with Share and Save.
- Revealing the card, saving it and its history work as before.

**Journal list**
- The scene shows the Moon over the lake with "Journal" in the serif.
- Search and New Entry sit at the foot of the scene.
- The filters, Calendar, Insights, Notebook and the entry rows are unchanged.

**Journal editor**
- The header has **Save** at the right. Writing is still kept as it is typed; Save keeps it immediately and confirms.
- A Whisper entry shows its card in the gilt frame.
- The reflection sits in a bordered pane under a writing toolbar:
  - list
  - quote
  - a line to remember (✦)
  - the time
  - a break between thoughts
- The toolbar only inserts plain characters, so the reflection is stored as the same plain text it always was.
- Once something has been written and you leave the pane, the border falls away and the text reads as a page of the journal.
- The prompts and "Today I'm taking with me…" are unchanged.

**Calendar**
- A gilt-framed parchment grid ruled in gold.
- The painted Moon marks new, quarter and full moons. Every other day has a small engraved Moon showing how much is lit that night.
- The selected day, the entry dots and the entries for the chosen day are unchanged.

**Insights**
- The figures sit in gilt parchment cells, the theme icons are framed, and the bars are coloured.
- Fixed a bug: the Career bar, and the matching bar in Dream Patterns, never filled in. A global `.b3` rule from the birth chart was overriding them; the bars now use their own `tb*` classes.

**New Entry**
- The sheet was already as the mockup shows: the entry types with their illustrated icons. It is checked in the flows.

## Assets

- `hero-horoscope`, `hero-tarot`, `hero-journal` (1024 square) and `hero-insights` were repainted without painted frames.
- `ce-vignette` is new.
- The Whisper paintings were resized from 1024×1536 to 720×1080, cutting them from 34 MB to 19 MB.
- The tarot deck was resized to 720 px wide.
- At 720 px, both are still sharper than the largest size they are shown at.

## Not changed

- Journal storage, reading calculations, forecast generation and caching, navigation, saved entries, favourites, search and filters.

## Checked

- All 40 screens: no errors, and no horizontal overflow at 390.
- The interaction flows:
  - onboarding
  - Whisper reveal
  - entry autosave, prompts and intentions
  - free write, tear-out and undo
  - dreams
  - affinity
  - tarot save
  - notebook
  - library search
  - horoscope save
  - old links
- A new test for the writing tools and Save: the text is kept, the marks are inserted, and the journal is saved.
