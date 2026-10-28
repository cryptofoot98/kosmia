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
| Sky with the sun and crescent | `ob-welcome` (top only) | Zodiac |
| Crown of night with crescent and lilies | `home-sky`, masked into the parchment | Ancient Wisdom, Welcome Back, Check your inbox, Reset |
| Botanical night | `home-vines` | Zodiac (middle), Account (top, left border faded behind the title) |
| Woman before the golden moon | `welcome` | Account (upper right); Ancient Wisdom (centrepiece in a window with no hard edges) |
| Golden sunset over the lake | `home-energy`, its sky dissolving upward | The foot of every page |
| Zodiac medallions | `zm-*`, unchanged | Zodiac |

**Small helpers:**
- `obBg()`: the painted layers.
- `obRule()`: the gold rule with its star.
- `pickSign()`: the one-tap choice.
- `enterApp()`: into Kosmia.

**Selected sign:** a champagne ring and glow, a slight scale-up, and its name underlined, so the choice doesn't rely on colour alone. It is still a radio button with `aria-checked`.

## New paintings: not made

Five bespoke paintings are scripted in `scripts/craft-atlas.mjs` but were not painted, because the OpenAI account had no credits left:
- `ob-sunset`
- `ob-sky`
- `ob-woman`
- `ob-wisdom`
- `ob-crescent`

The screens use the approved existing art instead. If credits are added, `node scripts/craft-atlas.mjs --refs <crops> --ids ob-sunset,ob-sky,ob-woman,ob-wisdom,ob-crescent` paints them, guided by crops of the mockups.

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

- **Woman's outfit:** she wears the approved art's red shawl, not the mockup's ivory blouse. On the account page she sits to the right as in the mockup, but she is the same painting as on the introduction.
- **Sunset:** it is the existing Cosmic Energy landscape, with palm fronds at its top corners, rather than the mockups' lily-framed sunset.
- **Feature rows:** the rows on Ancient Wisdom have no chevrons. The rows are not links, and a chevron would promise a tap that does nothing.
- **Zodiac height:** the zodiac page is a little taller than one screen at 390×844, so the sunset sits just below the fold.
