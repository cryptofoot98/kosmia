# Stage 2 — Home screen and main navigation

The reference is `docs/mockups/home-top.webp` and `home-bottom.webp`. The comparisons are in `docs/review/`:
- `stage2-home-390.webp` puts the mockup beside the build at 390×844.
- `stage2-home-430x932.webp` and `stage2-home-360x740.webp` show the build at those sizes.
- The build was also checked at 320×640.

## How Home is built

The page has three parts.

1. **The header scene** (`Kit.scene`, class `.hhero`) is laid out in units of its own width (`cqw`), so its proportions hold on every phone. Its layers, back to front:
   1. `home-sky`: the night sky, crescent, sun face, vines, lilies and roses, with no figure.
   2. `home-halo`: the golden moon, behind the card.
   3. The forecast card: real text and a working button, anchored at the upper right (left edge 45%, about half the width, as in the mockup).
   4. `fg-<sign>`: the sign's figure, cut out, in front of the card and anchored to its foot at the lower left.
   5. The five insight tiles, over the hem of the figure's gown.
2. **The night band** (`home-vines`, edged with lilies and roses) holds the Daily Whisper. It is followed by the Cosmic Energy landscape (`home-energy`), which runs edge to edge.
3. **The parchment sheet** has gold rules down both sides. It holds the events, Explore, Recent Readings, the Kassandra banner and the closing sun banner (`home-sun`).

### The figure and the card

- The figure's box sits at −11% to 61% of the screen width.
- The figure is clipped at a vertical line 84% of the way across its box. That line lands just short of where the card's text and button begin, at 51%.
- Below that, a band at the card's foot lets the gown overlap the card's bottom edge.
- The result: the figure overlaps the card's left margin and its foot, but never its text or button.
- Libra's scales hang right at the edge, so her clip sits a little further right (`.s-libra`).
- To keep the card's height steady, the forecast on the card is whole sentences up to about 150 letters, always at least one. The full reading is one tap away.

### Navigation

- The icons are bespoke engraved SVGs in `kit.js`:
  - a sixteen-ray sun with a face
  - a crescent moon
  - a tarot card with a star
  - an eight-point star
  - a moon-face medallion
- The active destination is shown in darker ink with a fine underline. The bar respects the safe area, and the page keeps room for it.

## Assets made for this stage

These were painted with `scripts/craft-atlas.mjs`, with crops of the mockup sent as style references, and cut out with `scripts/cutout.py`. That script flood-fills the flat grey the figures were painted on, then removes the grey fringe from their edges.

- `home-sky` (1024×1536), `home-halo` (560, transparent), `home-vines`, `home-energy`, `home-sun`
- `fg-<sign>` ×12 (900×900, transparent)

The old one-piece headers (`hero-<sign>` ×12) and `sun-panel` were retired.

## Deliberate differences from the mockup

- **Type size.** The mockup sets the card's forecast and the tile captions at about 9px. Here they are at least 12.5px and 10px, for legibility. That makes the card and the tiles slightly taller than in the mockup.
- **The Daily Whisper card** shows today's Whisper (one of 100) with its number in the deck. The mockup's "XVII The Star" is a tarot card. The Whisper paintings are still the older, paler style; repainting them is listed in the asset manifest.
- **The avatar** shows the sign's medallion until a photo can be uploaded.
- **Events and copy** come from live data: the real upcoming eclipses, moons and stations, and the user's own forecast.
