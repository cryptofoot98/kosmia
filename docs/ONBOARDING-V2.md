# Onboarding v2: four screens

**Date:** 28 October 2026

**Reference:** `docs/mockups/ob2-intro.png`, `ob2-sign.png`, `ob2-account.png` and `ob2-signin.png`.

**Comparisons:**
- `docs/review/ob2-intro.webp`, `ob2-sign.webp`, `ob2-account.webp` and `ob2-signin.webp`: mockup, before and after for each screen.
- `docs/review/ob2-<viewport>.webp`: all five pages at each tested size.

## The flow

1. **Welcome:** unchanged.
2. **Ancient Wisdom for Modern Life:** what Kosmia holds; Let's Begin.
3. **What's your zodiac sign?** One tap on a medallion chooses the sign: it lights for a moment, then the page moves on. There is no button on this screen.
4. **Create Your Account:** the existing form, validation and sign-up.

**Removed:** the sign confirmation, the optional birth details, the notification choices and the closing "Welcome to Kosmia" page. Birth details and notifications stay in the profile and settings, unchanged. A successful sign-up opens Kosmia directly.

- **Without accounts (local mode), or already signed in:** the sign tap opens Kosmia.
- **With email confirmation switched on:** the "Check your inbox" page still follows sign-up.

**Unchanged:**
- Welcome Back (sign in), forgot password and the reset page.
- Returning readers go straight to Home.
- The sign-up and sign-in calls, validation rules and stored data are untouched.

"Not sure of your sign?" is kept under the grid as a small link. A birthday selects the sign and asks the reader to tap it, rather than moving on by itself.

## Layers

Each page paints its art behind its content in one layer (`.obg`). The layer sits at z-index −1 inside the page's own stacking context, takes no taps and is hidden from screen readers. CSS only places, masks and frames the art; it never imitates scenery with gradients.

| Layer | Art | Used on |
|---|---|---|
| Woman before the golden moon, title in a parchment cloud | `ob-wisdom` | Ancient Wisdom (the head of the page; the title and its line sit in the painted cloud) |
| Sky with the sun, crescent and flower borders | `ob-sky` | Zodiac (from the top) |
| Woman before the moon at the right, open sky at the left | `ob-woman` | Account (across the top; the title sits in the open sky) |
| Botanical night | `home-vines` | Account (down the sides of the form) |
| Crown of night with the crescent, opening into parchment | `ob-crescent` | Welcome Back, Check your inbox, Reset |
| Golden sunset over the lake, lilies and roses | `ob-sunset`, shown as its lower band, its sky dissolving upward | The foot of every page |
| Zodiac medallions | `zm-*`, unchanged | Zodiac |

The sunset is shown in a band of fixed proportion at the page's foot (`min(96vw, 460px)`, cropped from the bottom). The band's top stays transparent before the sky fades in, and each page's bottom padding ends its text above the sunset's first light.

**Small helpers:**
- `obBg()`: the painted layers.
- `obRule()`: the gold rule with its star.
- `pickSign()`: the one-tap choice.
- `enterApp()`: into Kosmia.

**Selected sign:** a champagne ring and glow, a slight scale-up, and its name underlined, so the choice doesn't rely on colour alone. It is still a radio button with `aria-checked`.

## The bespoke paintings

Five paintings were made with `gpt-image-2` on 29 October 2026, each guided by a crop of its mockup (`scripts/craft-atlas.mjs`, ids below), then re-encoded for phones:

| Painting | Size | Weight |
|---|---|---|
| `ob-wisdom` | 1024×1024 | 271 KB |
| `ob-sky` | 900×1350 | 310 KB |
| `ob-woman` | 1200×800 | 237 KB |
| `ob-crescent` | 1200×800 | 221 KB |
| `ob-sunset` | 960×1440 | 378 KB |

They replace the stand-ins used at first (`ob-welcome`, `home-sky`, `welcome` and `home-energy` on these pages), which stay in use elsewhere in the app.

## Ancient Wisdom, second pass (29 October 2026)

**Reference:** `docs/mockups/ob3-intro.png` (approved). **Comparison:** `docs/review/ob3-intro.webp` (reference, before, after).

- **The painting** (`ob-wisdom`, repainted from a crop of the reference with its text blanked): a larger parchment cloud holds the title, its rule and the whole subtitle; its foot is a bank of cream clouds melting into the parchment, so the rows begin in the cloud, not under a hard edge. It is shown 112% wide (the outer vines cropped) so the cloud is tall enough at every width, and it starts below the status bar.
- **The rows:** old parchment plaques with a double gilt edge and aged, darker borders, joined by a small gold lozenge, each with a decorative chevron; titles in EB Garamond semibold, subtitles in EB Garamond.
- **The medallions:** five new paintings after the reference (`obm-sun`, `obm-tarot`, `obm-moon`, `obm-star`, `obm-dream`, 192 px, about 8–11 KB each); Kassandra keeps her portrait.
- **The flowers:** the sunset's lilies and roses start below Let's Begin at every tested size and never reach the rows.

## Checks

**Viewports:** 360×800, 375×812, 390×844, 393×852, 430×932, 360×640 and 768×1024 (welcome, intro, sign, account, sign in):
- no sideways scrolling
- the art takes no taps
- every button, field and link hit-tests to itself, so nothing covers a control

**Flow** (`flows2`, local mode): welcome → intro → sign → a tap opens Home with the sign saved. The rest of the flow test passes.

**Account form** (dummy project, offline):
- a weak password or a mismatch keeps Continue disabled, with a message
- three met rules enable it
- show/hide works
- sign-in uses `current-password`

**Regression:**
- `func6`: 29/29
- the 40-screen tour at 390×844: no errors or overflow

## Remaining differences from the mockups

- **Same story, new paintings:** the paintings follow the mockups' compositions but are new paintings, not copies, so details differ: the exact pose, the flowers and how far the town reaches.
- **Feature rows:** the chevrons on Ancient Wisdom follow the approved design but are decorative (hidden from screen readers); the rows are not links.
- **Side vines:** the vines that run down beside the rows on Ancient Wisdom in the reference are not drawn; the page's flowers stay in the painting above and the sunset below, clear of the rows.
- **Height:** the zodiac and account pages are a little taller than one 390×844 screen, so the lowest part of the sunset sits just below the fold. Welcome Back fits on one screen with the sunset in view.
