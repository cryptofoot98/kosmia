# Stage 1 — visual foundation and asset architecture

The eight mockup boards in `docs/mockups` are the approved specification. This stage audits the app, sets the tokens,
builds the scene system and the component kit, and lists the assets; it does not redesign screens. Every screen renders
as it did before, apart from the bottom bar's icons, the section-heading stars and the slightly warmer parchment.

## 1. The app as it stands

| | |
|---|---|
| Framework | None. A static single-page app: `public/app.js` is one script whose views return HTML strings; `render()` writes them into `#app`, and clicks are handled by delegation on `data-act`, `data-go` and `data-nav`. |
| Styling | One stylesheet, `public/styles.css`: plain CSS with custom properties. No preprocessor or utility framework. |
| Fonts | Google Fonts: Cinzel (display), Cormorant Garamond (editorial serif), EB Garamond (body), Source Sans 3 (long readings), Parisienne (journal hand). |
| Icons | Inline SVG strings (`IC` in app.js) plus painted, keyed raster icons in `art/atlas`. No icon library. |
| Images | Static WebP files under `public/art`, painted by `scripts/craft-atlas.mjs` (OpenAI images) and finished by a keying and resizing script. Two helpers place them: `ui(id)` for `art/atlas`, `pic(kind,id)` for the older folders. |
| Data and services | `cloud.js` (Supabase auth and sync), `sky.js` (astronomy-engine ephemeris), `forecast.js`, `numbers.js`, `tarot.js`, `whispers.js`; Netlify functions for Kassandra, voice, dreams and quotas. **None of these was touched.** |
| Routing | The History API: `/home`, `/horoscope[/sign]`, `/tarot[/whisper\|reading\|history\|journal\|entry\|calendar\|insights\|notebook]`, `/discover[/…14 pages]`, `/kassandra[/history]`, `/settings[/…]`; earlier addresses get 301s in `netlify.toml`. |

### Screens and their mockups

| Screen (route) | Mockup board |
|---|---|
| Home `/` | `home.webp`, `home-top.webp`, `home-bottom.webp` (primary); `overview.webp` (an earlier variant) |
| Horoscope `/horoscope`, sign `/horoscope/sign` | `horoscope.webp`; `overview.webp` (Libra) |
| Tarot `/tarot`, Daily Whisper, Card Reading, History | `tarot-journal.webp`; `overview.webp` (Daily Card) |
| Journal library, entry, new entry, calendar, insights, closing page | `tarot-journal.webp` |
| Discover `/discover` and Birth Chart, Affinity, Name Within, Life Path, Dream Interpretation, New Dream, Dream Meaning, Cosmic Calendar, Astrology Library | `discover.webp`; `overview.webp` (Calendar, Compatibility, Birth Chart) |
| Kassandra `/kassandra` | `overview.webp` |
| Onboarding (welcome, features, sign wheel, sign confirm, account, details, notifications, welcome) | `onboarding.webp` |
| Settings, Notebook, Cycles, Moon, Planets, Synastry, Profile, Resonance | No board: they follow the system. |

### Where the screens are still generic or simplified

- **Home header.** The sign's figure is painted into the sky as one picture. The mockup's forecast card and tiles overlap the figure, which needs a separate background and a transparent figure. This is the main reason Home doesn't match yet.
- **Whisper cards and the tarot deck** are in the older pale watercolour style, not the mockup's navy skies with gold stars.
- **Flat panels.** Plain `.card` panels and list rows are flat parchment with a hairline. The mockups use richer gilt frames and botanical corners on several screens.
- **Section landings** (`hero()`): the painting ends and the parchment sheet starts. The mockups let flowers and scenery run over that edge.
- **Hero resolution.** Most heroes are 640 px wide, short of the 960 px or more that a sharp full-bleed image needs at 2×.
- **Settings and utility pages** have no board and use the generic panel, which is acceptable.

### Where a visual change could break something

- `.scene` is already taken by the 3D card flip (`cardScene`, the Home whisper). The scene system therefore uses `.kscene` and `.ks-*`.
- Some CSS keys on image addresses (`.dtile img[src*="/m-"]`, `img[src*="ex-chart"]`), so renaming art files silently changes layout.
- The journal notebook has its own stacking contexts and its own page-turn and tear animations, and it re-measures its layout after render (`jlay`). Its z-indexes are local and were left alone.
- `render()` replaces `#app` wholesale on every state change. Components must be pure HTML, with no per-element listeners.
- Parallax moves any `.parallax` element on scroll, and the effect respects reduced motion.
- The sticky page header (`.phd`), Home's folded bar (`.hbar`), the bottom bar, pop-ups and toasts all share the page's stacking order. They now take their values from tokens.

## 2. Design tokens (top of `styles.css`)

All tokens are centralised in one `:root` block; the earlier short names are kept as aliases so nothing had to be rewritten.

- **Palette.** Colours were sampled from `home-top.webp` and `home-bottom.webp`, then refined toward the brief's suggested values:
  - Midnight `#0B1522`, celestial `#13253A`.
  - Gold `#B98A4E`, light gold `#E2BC80`, deep gold `#8A6430`.
  - Parchment `#E9D0A4`, light parchment `#F3DDB6`, ivory `#FAEED8`.
  - Ink `#35271D`, burgundy `#733A42`, rose `#B8655A`, green `#66705B`.
- **Surfaces.** RGB triplets (`--k-surface-rgb`, `--k-gold-rgb`, `--k-night-rgb`, `--k-shadow-rgb`). 363 hard-coded colour literals in the stylesheet now go through them, along with the opacity steps (`--op-*`).
- **Type.**
  - Font roles: `--font-display`, `--font-serif`, `--font-text`, `--font-read`.
  - Scale: `--fs-2xs` to `--fs-hero`; letter-spacing and line-height tokens.
- **Spacing, radii, borders and shadows:** `--sp-*`, `--r-*`, `--bd-*`, `--inset-gilt`, `--sh-1` to `--sh-3`, `--sh-lift`.
- **Stacking.**
  - Page level: `--z-sticky`, `--z-menu`, `--z-bar`, `--z-nav`, `--z-pop`, `--z-toast`.
  - Inside a scene: `--zs-bg`, `--zs-sky`, `--zs-under`, `--zs-content`, `--zs-over`, `--zs-ctrl`.
- **Ornament:** the engraved gold corner flourishes (`--c-tl`, `--c-tr`, `--c-bl`, `--c-br`) as SVG.
- **Motion:** `--ease`, `--dur-1`, `--dur-2`.

## 3. Scene system (`Kit.scene`)

Each scene is its own stacking context, so its layers never compete with the page's. It has three layers:

1. **Background:** a painted scene, set to cover with a chosen focal point (`bgPos`). It can be veiled for legibility, can drift with parallax, and can be **pinned**, so it stays put while the content scrolls over it (sticky, not `background-attachment`, which phones ignore).
2. **Content:** real HTML: parchment, buttons, text.
3. **Foreground** (`Kit.fg`):
   - A transparent painting anchored by left, right, top or bottom, and sized as a share of the scene's width.
   - It sits either over the content or under it.
   - It has `pointer-events: none`, so it never takes a tap.

The scene takes its shape from the background's own proportions (`art/sizes.js`), so nothing jumps while the image loads. Home's header and every section hero now run on it.

## 4. Component kit (`public/kit.js`, gallery at `/kit.html`)

| Concept | Kit | Notes |
|---|---|---|
| KosmiaPage | `Kit.page` | A landing (a scene with a sheet over it) or a plain page with its header |
| CelestialScene | `Kit.scene` | Section 3 |
| ForegroundIllustration | `Kit.fg` | Section 3 |
| ParchmentPanel | `Kit.panel` | Frames: plain, `ornate`, `gilt` (new: inner rule and four corners). `panel()` in app.js uses it |
| OrnamentalFrame | `Kit.frame` | Shapes: `rect`, `arch`, `circle`; optional outer corner flourishes |
| CelestialDivider | `Kit.divider` | Rules with a star, or a label between them |
| ZodiacHero | `Kit.scene` + `Kit.fg` | A sign's background plus its transparent figure. It waits on the figure assets (Missing) |
| IllustratedSectionHeader | `Kit.heading` | Engraved star, spaced capitals, optional See all. `orn()` uses it |
| IllustratedFeatureCard | `Kit.feature` | Parchment or night variant, for the Discover grid |
| TarotCardDisplay | `Kit.tarot` | Gilt card frame, numeral cartouche and name plate as live text |
| CosmicEventCard | `Kit.event` | Home's event row uses it |
| EngravedIcon | `Kit.icon` | Fine-line SVG: sun, moon, tarot, compass star, Kassandra moon, star, arrow |
| AntiquePillButton | `Kit.pill` | Dark, ghost, gold and light variants, with an optional arrow |
| KosmiaBottomNavigation | `Kit.nav` | Now uses the SVG engraved icons (crisp at any density) instead of the painted raster ones |

## 5. Performance and accessibility

- **No layout shift.** Every image carries its intrinsic width and height (`art/sizes.js`, generated), so its space is held before it loads. A zero-specificity rule keeps any existing sizing rule in charge.
- **Load order.** The first painting on a screen (Home's header, each section hero) loads at once with high priority; everything else loads lazily and decodes asynchronously. Before this, the heroes were lazy too.
- **Reduced motion.** Parallax inside scenes stops under `prefers-reduced-motion` and under the app's own Reduce motion setting, alongside the existing card-flip and star rules.
- **Screen readers.**
  - Decorative art has empty alt text, and foreground art is hidden from assistive technology.
  - Icons are `aria-hidden` unless labelled.
  - The current destination in the bottom bar keeps `aria-current="page"`.
- **Taps.** Foreground layers never intercept them, and the safe-area insets are unchanged.

## 6. Assets

The full inventory is in `docs/asset-manifest.md`, generated by `node scripts/asset-manifest.mjs` (re-run it whenever art changes).

- **Counts:** 388 images. 344 are in use, and all of them are provisional (none signed off against the mockups yet). 44 are unused: the `nav`, `plates` and `scenes` folders and a few old grounds.
- **Missing** (12 groups):
  - Home background-only scenes and transparent sign figures ×12, plus foreground flower sprays.
  - The tarot deck ×78 and the Whisper cards ×100 in the mockup style.
  - Five onboarding scenes and the creature-style sign medallions.
  - Journal, dream-symbol and library thumbnails, and an avatar frame.
  - High-density hero masters.

## 7. Outstanding before Stage 2

1. **Your sign-off** on the tokens and the kit (`/kit.html`).
2. **Asset production for Home:** 12 background scenes and 12 transparent figures, plus flower sprays. This is roughly 30 images, about $5–8 with the project's OpenAI key. The image model cannot paint transparency, so figures are painted on flat ivory and keyed out, as the icons are now.
3. **Repainting the tarot deck and Whisper cards** in the mockup style: about 180 images, roughly $15–20. Do this before the Tarot and Journal screens are rebuilt.
4. **Still pending from earlier:**
   - Applying the dreams and conversations database migration (it needs your approval).
   - The Kassandra sign-in test.
