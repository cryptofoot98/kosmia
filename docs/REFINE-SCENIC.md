# Scenic continuity: Home and Discover

**Date:** 28 October 2026

**Reference:** `docs/mockups/refine-home-discover.png` (the refinement mockup), with `home-bottom.webp` and `discover.webp`.

**Comparisons:** `docs/review/refine-home.webp` and `refine-discover.webp` set the mockup, before and after side by side. The five required sections (Home top, middle and lower; Discover top and lower) are in `refine-360x800`, `refine-390x844`, `refine-430x932` and `refine-768x1024`.

## The cause

- **Home:** the header scene and the night band behind the Whisper and Cosmic Energy are painted. Everything after them (events, Explore, Recent Readings, Kassandra and the closing sun) sat inside `.hsheet`, an opaque parchment block. So the illustration stopped dead below Cosmic Energy.
- **Discover:** the eight cards sat on the floral band stretched to `cover` over the whole page. The "More of the sky" list was a full-width parchment sheet that replaced the scene partway down.

## The fix: one shared scene layer

`scenic(content, cls)` in `public/app.js` wraps the lower part of both pages:

```
.kscenic             position:relative; isolation:isolate
  .ksc-bg            absolute, inset 0, z-index 0, pointer-events none, overflow hidden
    home-vines       the floral night band, centred (fills any middle gap on long pages)
    home-lake        Scene C, anchored at the top: the night lake after the sunset landscape
    home-garden      Scene D, anchored at the foot: the closing garden, lake and balustrade
  .ksc-in            relative, z-index 1: the existing panels, unchanged
```

- **No stretching or tiling:** each segment is the column's width at its own ratio. They overlap and blend through gradient masks, with no `background-repeat`, no fixed backgrounds and no parallax.
- **Down to the foot:** the scene runs under the bottom bar's space, so the garden is still there at the end of the page. The last panel stays clear of the bar at every size.
- **Home:** the panels have slightly wider side margins and gaps (about 2% of the width each) so the flowers show around and between them. Each panel has a soft shadow. The gold double rule down both sides now runs the full height.
- **Discover:** the first row of cards still rises over the foot of the header scene, and the scenery begins under that overlap. "More of the sky" is now a floating gilt panel over the night instead of a full-width sheet.

**Kept as they were:**
- the event cards and their art
- the Explore medallions
- Recent Readings
- the Kassandra banner and portrait
- the closing sun
- Discover's header, features and art
- the bottom bar, routes and data

## New art

Painted with the project's OpenAI key, steered by a crop of the refinement mockup. Both use the floral band's palette and motifs (lilies, roses, palm fronds, gold vines, navy starry sky) and are saved at 720×1080.

| Image | Content | Size |
|---|---|---|
| `home-lake` | the night lake | 164 KB |
| `home-garden` | the crescent garden with lake and balustrade | 212 KB |

## Compact header

On Home, the compact header still slides in after 120px of scrolling. It is fixed, so it never moves the page, and keeps its gold rule, shadow and safe-area inset. It now also fades in and out. While hidden, it can't take focus, so keyboard users don't land on its avatar off-screen. Under reduced motion it appears without animation.

## Checks

**Viewports** (360×800, 390×844, 430×932, 768×1024; Home and Discover):
- no sideways scrolling
- scene layers take no taps
- every panel's centre hit-tests to the panel itself, so no artwork covers content
- all scene images loaded
- the scene reaches the bottom of the page
- the last panel clears the bottom bar

**Regression:**
- 40 screens at all four sizes: no errors, no overflow
- `func6`: 29/29
- `flows2`: pass

**Performance** (390×844 at 3×):

| Page | Layout shift | Images |
|---|---|---|
| Home | 0.000 | 3.55 MB (was 3.2 MB) |
| Discover | 0.002 | 2.65 MB (was 2.3 MB) |

Scrolling runs at 127 fps. The new images load lazily.

## Remaining differences

- **Recent Readings:** the refinement mockup shows Explore's medallions under "Recent Readings" and adds a separate "Today's Readings" list. That looks like a labelling slip in the mockup, so the app keeps Explore Kosmia and Recent Readings as they were.
- **Whisper card:** the mockup's card art ("The Nautilus") is the navy, starry style. The app's 100 Whisper paintings are still the older pale style (see Stage 6, unresolved 1).
