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
| The approved mockup's scenery: the cloud, the woman and the moon; the vines and the sunset | `aw-top`, `aw-foot` | Ancient Wisdom (the whole page) |
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

## Ancient Wisdom, one illustrated page (29 October 2026)

**Reference:** `docs/mockups/ob3-intro.png` (approved). **Comparison:** `docs/review/ob3-intro.webp` (reference; the previous build on an iPhone; after at 390×844; after at 390×664, a Safari-sized screen).

**The art is the approved mockup's own scenery,** prepared as two layers (`scratchpad prepaw.py` steps, recorded here):
- the interface was lifted out of the flattened mockup: the title, rule, subtitle, back arrow and closing divider by OpenCV inpainting; the status bar's two corners by a masked `gpt-image-2` edit pasted back only where the bar was; the six rows' box filled with parchment toned to the mockup's
- `aw-top` (850×846): the parchment cloud, the woman before the moon, the lake and the lilies, anchored to the top and cropped from below on shorter screens
- `aw-foot` (850×1004): the vines beside the list, the sunset, the lake and the corner flowers, anchored to the bottom edge with no box or seam

**One screen, no scrolling:** every height is worked out from the visible screen (`dvh`): six rows of `clamp(48px, 6.4dvh, 62px)`, a foot of `clamp(84px, 13dvh, 124px)`, and the painting takes the rest (never under 250 px). At 390×844 this reproduces the mockup's proportions almost exactly (rows from 387 px, as in the mockup). On a screen too short to hold it, the page scrolls instead of shrinking the text.

**The rows:** a fine gilt line, a parchment face matching the page (opaque enough that the corner flowers never show through), a thin inner rule, small gold lozenges between rows, the painted medallion (`obm-*`, Kassandra's own portrait), titles in EB Garamond semibold, decorative chevrons.

**Let's Begin** is a compact button where the mockup's closing divider stood, above the sunset.

**Corrections (29 October 2026, later):**
- **The rows carry no chevrons:** they describe features and are not links; the arrow column is gone and Let's Begin is the page's only action.
- **The painting on shorter screens:** the rows may compact to 44 px and the painting first gives up up to 30 px of the empty band above the title (the title and back arrow move up with it, never under the safe area), so the woman's face and shoulders stay in view before anything below them is cropped. At the standard sizes (375×812 to 430×932) nothing is cropped beyond the mockup's own frame. Sizes: `docs/review/ob3-intro-sizes.webp` (reference, 375×812, 390×844, 393×852, 430×932, 390×664).
- **No navy strip:** the page no longer pulled itself up by the app's bottom padding (which onboarding already removes). On this screen only, the ground outside the page (behind Safari's toolbar, or shown by a bounce) is the dark brown of the flowers at the sunset's foot instead of the app's navy, and the bounce is turned off.

The earlier bespoke `ob-wisdom` painting is retired (deleted with its paint job).

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
- **Ancient Wisdom:** the closing divider star gives way to Let's Begin, which the mockup doesn't show; on screens shorter than about 750 px the painting is cropped higher (the woman shows from the shoulders up).
- **Height:** the zodiac and account pages are a little taller than one 390×844 screen, so the lowest part of the sunset sits just below the fold. Welcome Back fits on one screen with the sunset in view.
