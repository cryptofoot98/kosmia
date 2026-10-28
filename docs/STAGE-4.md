# Stage 4 — Discover

The reference boards are `docs/mockups/discover.webp` and the Calendar, Compatibility and Birth Chart screens in `overview.webp`. Each screen has a comparison image in `docs/review/stage4-<screen>.webp`, showing the mockup (and the detail mockup where there is one) beside the before and after builds. Screenshots are 390×844, with the same seeded data each time.

## What changed

**Discover landing**
- The scene was repainted edge to edge: a crescent, an eight-pointed star, the "DISCOVER" title, the intro line, and a moonlit lake with a hillside town below.
- Under it is the illustrated library of eight, on parchment cards ruled in gold. Each feature has its own painting in its own shape:
  - Medallions: Birth Chart (the golden sun), Zodiac Affinity (the paired portraits), Soul Resonance (the radiant heart) and The Name Within (the triangle and eye).
  - Arches: Life Path (the mountain path) and Dream Interpretation (the sleeping woman).
  - Night banners: Cosmic Calendar (the moon phases) and Astrology Library (the books and globe).
- Cosmic Profile, My Cycles, Synastry, The Moon, Planets and Celestial Events keep their places under "More of the sky".

**Birth Chart**
- It now opens on the mockup's introduction: the framed sun-and-wheel plate, the lead text, View My Birth Chart, and four rows (Planetary Positions, Houses, Aspects and Full Interpretation). Each row opens the chart on that view.
- The chart itself is unchanged and is the reader's own. The wheel is drawn from their calculated positions, with the painted sun only at its centre, together with the tabs, the big three, the houses and the method note.
- Back returns from the chart to the introduction.
- Without a birth date, the birth form and the four rows are shown, the rows inactive.

**Zodiac Affinity**
- Before a match: the framed sun-and-moon plate, both sign selectors, See Compatibility, and the four readings it holds, listed but inactive.
- The result is unchanged: the two medallions joined by a heart, the title, the calculated overall score, and Love, Friendship, Communication and Values with the full readings. The lakeside scene closes the page.
- No percentages are fixed. They come from `affScore`, so Libra and Aquarius score 94% overall, not the mockup's 86%.

**The Name Within and Life Path**
- Until a name or date is given, they list the readings they hold, as the mockups do:
  - Name Within: Expression, Soul Urge, Personality and Destiny.
  - Life Path: the Life Path Number, Key Strengths, Challenges and Guidance.
- After that, the calculated readings show as before.

**Cosmic Calendar**
- The events of the month are unchanged: lunar paintings, dates, names and words, from the ephemeris.
- A new parchment lakeside scene (`cal-scene`) closes the page, as in the mockup.

**Dream Interpretation, New Dream, Your Dream Meaning, Astrology Library and Soul Resonance**
- These already followed the mockups and are unchanged.
- The dream reading uses the illustrated symbol library: the owl, water, forest, moon, flying and so on.
- Kassandra's AI reading is offered only when signed in. Otherwise the dream dictionary's reading is shown, and the page says so.

## Assets

- `hero-discover` (1024 square, painted edge to edge) and `cal-scene` are new.
- Every other feature painting already existed and was reused: the `ex-*` medallions, `hero-lifepath`, `hero-dream`, the `banner-*` banners and the framed `hero-*` plates.

## Not changed

Birth data, chart calculations, the compatibility and numerology logic, events, dreams, routes and the library content.

## Checked

- All 40 screens: no errors and no horizontal overflow.
- All interaction flows.
- New checks:
  - The Birth Chart rows open the chart on the right view, and Back returns to the introduction.
  - Choosing a sign gives a calculated match.
  - The calendar's lakeside scene loads when scrolled to.
