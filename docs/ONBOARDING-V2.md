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
| The approved mockup's scenery: the sun and crescent, the night with its flowers, the sunset | `zs-bg` | Zodiac (the whole page, shown twice) |
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

**The painting's foot (approved 29 October 2026):** a low bed of painted cream-gold clouds (`aw-clouds`, `gpt-image-2` on flat navy, keyed to transparency) lies over the painting's bottom edge, so there is no straight cut. Its puffs just overlap the dress; it has no flat base: its lowest puffs, toned to the parchment's own colour, dissolve straight into the textured parchment beside and behind the first row. The painting itself, the rows and everything below are unchanged. Comparison: `docs/review/ob3-intro-clouds.webp` (approved design, 390×844, 402×715).

**Corrections (29 October 2026, later):**
- **The rows carry no chevrons:** they describe features and are not links; the arrow column is gone and Let's Begin is the page's only action.
- **The painting on shorter screens (approved preview, 29 October 2026):** the painting always keeps its whole frame: its bottom clouds and flowers meet the first row and its top star is never cut. The rows (44–62 px) and the foot take what it leaves. Where the screen is shorter, the painting and its title scale down together to 85% (`aw-top` is the mockup's frame with its sides painted further by a masked `gpt-image-2` edit, the original centre pasted back pixel for pixel, so the width stays filled); only below that does the woman's scene slide up, beneath the cloud's soft edge, over the empty sky above the moon (32 px at 390×664). The star rule is the mockup's own painted one; the title and subtitle are placed on it as in the mockup. Sizes: `docs/review/ob3-intro-sizes.webp` (approved design, 390×844, 402×800, 402×715, 390×664); top half: `docs/review/ob3-intro.webp`.
- **No navy strip:** the page no longer pulled itself up by the app's bottom padding (which onboarding already removes). On this screen only, the ground outside the page (behind Safari's toolbar, or shown by a bounce) is the dark brown of the flowers at the sunset's foot instead of the app's navy, and the bounce is turned off.

The earlier bespoke `ob-wisdom` painting is retired (deleted with its paint job).

## The zodiac page, one painting (29 October 2026, approved preview)

**Reference:** `docs/mockups/ob3-sign.png`. **Comparisons:** `docs/review/ob3-sign.webp` (design and 393×852), `docs/review/ob3-sign-sizes.webp` (design, the previous build on an iPhone, 393×852, 402×715, 375×667).

- **The blue band** was the page's own blue gradient showing between two separate paintings (`ob-sky` above, the sunset below). Now one painting lies behind the whole page: `zs-bg`, the approved mockup's own scenery with its interface lifted out (title, subtitle, the twelve medallions and their names, status bar and back arrow masked and repainted as the surrounding sky and landscape by a masked `gpt-image-2` edit; only the masked areas pasted back). It is shown twice, anchored to the top and to the bottom; the top copy dissolves into the bottom one inside the open starry sky, so shorter screens lose only open sky and never show a band or seam. `ob-sky` is retired.
- **One screen:** the title and subtitle sit where the mockup sets them; the medallions keep the mockup's spacing (row pitch 30% of the width) where the screen allows and shrink together on shorter screens, each row's height worked out from the visible screen so the sunset stays below the last row (89 px medallions at 393×852, 62 px at 375×667). No scrolling from 360×640 to 430×932 and on a tablet; all twelve on screen and tappable. "Not sure of your sign?" stays below the grid (opening it may extend the page).
- Unchanged: the medallions, names, gold rings, the selection glow, the one-tap choice.

## Create Your Account on one screen (29 October 2026, approved preview)

**Comparison:** `docs/review/ob3-account-sizes.webp` (390×844, 402×715, 375×667, 360×640).

- **No scrolling:** the artwork is unchanged; the empty band kept below the form is gone and the header and form spacing take their size from the visible screen. On screens under 780px tall the three password rules sit side by side; under 740px the title and labels are a little smaller and the sunset painting sits 20px lower (36px under 690px, where the form's small star rule is also hidden). Fits from 360×640 to 430×932 and on a tablet.
- **The flowers embrace the form:** `ob-sunset-blooms` is the sunset painting's own lily (lower left) and roses (lower right), cut out and laid exactly over themselves above the form. The form ends 14px below the lily's tallest petal, so the petal tips reach over its lower-left edge and the rose wraps its lower-right corner, clear of all text; they take no taps.

## Welcome Back as one painting (29 October 2026, approved preview)

**Reference:** `docs/mockups/ob3-signin.png`. **Comparison:** `docs/review/ob3-signin.webp` (design, the previous build on an iPhone, 393×852, 402×715, 375×667, keyboard open).

- **The art is the mockup's own painting** with its interface lifted out: the parchment under the title and form repainted by a masked `gpt-image-2` edit and blended in the gradient domain (no box edges), the status bar, back arrow and phone frame filled from their neighbours.
- **Two layers of it:** `wb-top` (the night, crescent, lilies and vines opening into the parchment with its painted star) from the top, and `wb-sun` (the sunset with clouds, sun, mountains, town, lake and flowers) from the foot. The mockup is three times taller than wide, so both are shown a little smaller than the mockup's scale, their sides painted further in the same style (the original centre unchanged, blended in the gradient domain).
- **One screen:** the sunset starts just below the last link at every size (its top dissolving into the parchment), so all text stays on parchment. On short screens (under 780px tall) the form tightens a little and the sunset's upper clouds and sun dissolve away; the town, lake and flowers are always kept. No scrolling from 360×640 to 430×932.
- **The form:** the mockup's serif heading and subtitle, cream fields with fine gold edges, a dark chocolate Sign In button with gold lettering (dark even before typing; dimmer lettering while disabled), burgundy links. The sign-in calls are unchanged.
- `ob-crescent` stays in use on Check your inbox and the reset page.

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
