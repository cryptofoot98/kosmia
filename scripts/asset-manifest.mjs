#!/usr/bin/env node
// Kosmia's asset manifest. It reads every image under public/art and writes two files:
//   public/art/sizes.js        each image's intrinsic width, height and alpha, so the app can reserve its space (no layout shift)
//   docs/asset-manifest.md     what every asset is for, the mockup it follows, the screen it serves, its format, crop and
//                              status, the assets the mockups still need, and the folders nothing uses any more
//
//   node scripts/asset-manifest.mjs
//
// Status: "approved" only once the owner signs an asset off against the mockups (APPROVED below); everything painted so
// far is "provisional"; "missing" assets are needed for a faithful reconstruction and do not exist yet.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const art = join(root, 'public', 'art');
const APPROVED = new Set([]);

// width, height and whether the image carries transparency, read from the file header
function probe(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const c = b.toString('ascii', 12, 16);
    if (c === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3), !!(b[20] & 0x10)];
    if (c === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff), !!((v >> 28) & 1)]; }
    return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff, false];
  }
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20), b[25] === 4 || b[25] === 6];
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length;) {
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5), false];
      i += 2 + len;
    }
  }
  return [0, 0, false];
}

// which mockup board each asset follows (docs/mockups)
const M = { home: 'home.webp', homeTop: 'home-top.webp', overview: 'overview.webp', horo: 'horoscope.webp', onb: 'onboarding.webp', tarot: 'tarot-journal.webp', disc: 'discover.webp' };

// what each asset is, by its name: [test, purpose, mockup, screen, crop, needs alpha, target width at 2x (px)]
const SPEC = [
  [/^atlas\/fg-/, 'The sign’s figure alone, cut out (scripts/cutout.py): stands before the halo and over the forecast card’s margin and foot', M.homeTop, 'Home header (foreground layer)', 'square box anchored to the card’s foot; clipped at the card’s text edge', true, 640],
  [/^atlas\/hsp-vine$/, 'The column of lilies and roses cut out of home-vines, laid over the left edge of a sign’s Horoscope painting', M.horo, 'Horoscope › sign page header', 'left edge, over the painting', true, 210],
  [/^atlas\/synastry-bg$/, 'The Synastry page’s backdrop: two linked golden zodiac wheels holding the sun and the moon over a rose terrace and moonlit sea (painted in the style of the owner’s backdrops)', M.disc, 'Discover › Synastry (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/chart-bg$/, 'The Birth Chart page’s backdrop: a golden sun face in a circle over the Milky Way, crescent moons and planets, clouds, and lilies, roses and daisies around a gilded arch (supplied by the owner)', M.disc, 'Discover › Birth Chart (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/affinity-bg$/, 'The Zodiac Affinity page’s backdrop: a golden sun with a woman’s face and a crescent moon with a man’s face facing each other over the Milky Way, clouds, lilies, roses and daisies (supplied by the owner)', M.disc, 'Discover › Zodiac Affinity (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/resonance-bg$/, 'The Soul Resonance page’s backdrop: a radiant red heart between two crescent moons above the Milky Way, golden clouds, and lilies, roses and daisies in a gilded frame (supplied by the owner)', M.disc, 'Discover › Soul Resonance (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/history-bg$/, 'The Reading History page’s backdrop: Moon phases over the Milky Way seen through a curtained window, a lakeside town, a velvet table with a tarot deck, a crystal ball, candles and a sun-faced zodiac cloth (supplied by the owner)', M.tarot, 'Tarot › Reading History (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/reading-bg$/, 'The Card Reading pages’ backdrop: the Milky Way across a starry sky, a crescent Moon, golden clouds at the foot (supplied by the owner)', M.tarot, 'Tarot › Card Reading, choosing the cards, the spread (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/whisper-bg$/, 'The Daily Whisper page’s backdrop: an arc of the Moon’s phases over the Milky Way, golden clouds, a lake under mountains, framed by lilies (supplied by the owner)', M.tarot, 'Tarot › Daily Whisper (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/journal-bg$/, 'The Journal Entry page’s backdrop: a night sky with a large Moon and arcs of the Moon’s phases over an open parchment, framed by white blossoms and leaves, a lake under mountains at the foot (supplied by the owner)', M.tarot, 'Tarot › Journal Entry (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/cycles-bg$/, 'The My Cycles page’s backdrop: a golden wheel of the year under an arc of the Moon’s phases, an hourglass of stardust, a lily terrace over a sea at dusk (painted in the style of the owner’s backdrops)', M.disc, 'Discover › My Cycles (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/events-bg$/, 'The Celestial Events page’s backdrop: a total solar eclipse, a meteor shower and a comet over golden clouds, a lily terrace and a moonlit sea (painted in the style of the owner’s Moon, Planets and Profile backdrops)', M.disc, 'Discover › Celestial Events (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/profile-bg$/, 'The Cosmic Profile page’s backdrop: the planets, a full moon, a sun-faced wheel and a spiral galaxy over golden clouds (supplied by the owner)', M.disc, 'Discover › Cosmic Profile (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/planets-bg$/, 'The Planets page’s backdrop: the planets, a sun-faced zodiac wheel and the Milky Way above a terrace over a sunset bay (supplied by the owner)', M.disc, 'Discover › Planets (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/moon-bg$/, 'The Moon page’s backdrop: a full moon and the Milky Way over a moonlit bay and lakeside town, a balustrade and lilies below (supplied by the owner)', M.disc, 'Discover › The Moon (whole screen)', 'fixed behind the page, cover', false, 850],
  [/^atlas\/hsh-/, 'The sign’s Horoscope hero: the plate’s figure unframed on the right, open night sky on the left for the title', M.horo, 'Horoscope › sign page header', 'cover, anchored top right; left and foot masked into the page', false, 1100],
  [/^atlas\/sgmw-/, 'A wide sign medallion painted to the outline of its plate’s cartouche (Cancer, Capricorn)', M.horo, 'Sign card', 'absolute over the plate’s cartouche', true, 444],
  [/^atlas\/sgm-/, 'The sign’s glyph medallion: engraved antique-gold rim, night-blue starry field, the glyph in gold (keyed from green)', M.horo, 'Sign card, Horoscope list, Profile', 'contain, circle', true, 320],
  [/^atlas\/home-sky$/, 'Home header background: night sky, crescent, sun face, vines, lilies and roses, no figure', M.homeTop, 'Home header (background layer)', 'cover, anchored top', false, 960],
  [/^atlas\/home-halo$/, 'Golden full-moon halo behind the figure, cut to a circle', M.homeTop, 'Home header (behind the card)', 'contain, circle', true, 400],
  [/^atlas\/home-vines$/, 'Night ground edged with lilies and roses, behind the Daily Whisper', M.homeTop, 'Home › Daily Whisper band', 'cover, anchored top', false, 720],
  [/^atlas\/home-energy$/, 'Sunset lake, mountains and flowers, edge to edge', M.homeTop, 'Home › Today’s Cosmic Energy', 'cover, anchored lower middle', false, 960],
  [/^atlas\/home-sun$/, 'Engraved sun on parchment for the closing banner', M.home, 'Home › closing banner', 'height-fit, anchored left, faded into the parchment', false, 640],
  [/^atlas\/plate-/, 'Framed arched portrait of the sign with the glyph roundel', M.horo, 'Horoscope › sign page', 'contain, whole frame visible', false, 780],
  [/^atlas\/med-/, 'Round medallion of the sign', M.onb, 'Onboarding sign wheel, sign grids, Explore every sign', 'contain, circle', false, 240],
  [/^atlas\/ico-/, 'Engraved, tinted area-of-life icon (keyed from ivory)', M.horo, 'Home quick tiles, Horoscope tiles, list rows', 'contain', true, 160],
  [/^atlas\/nvm-/, 'Bottom menu medallion: a round night-blue painting in a thin gold rim (sun, crescent and lilies, tarot card, compass star, crystal ball), cut free of its night disc with alpha, motif only (supplied by the owner)', M.home, 'Bottom navigation', 'contain', true, 128],
  [/^atlas\/nav-/, 'Bottom navigation icon (raster, keyed from ivory)', M.home, 'Bottom navigation', 'contain', true, 64,
    'Replaced in the UI by the SVG icons in kit.js (KosmiaBottomNavigation); kept until those are approved.'],
  [/^atlas\/ev-/, 'Celestial event plate: planet or moon on a starry ground', M.home, 'Home events, Cosmic Calendar', 'cover', false, 360],
  [/^atlas\/ex-/, 'Circular Explore medallion', M.home, 'Home › Explore Kosmia', 'contain, circle', false, 240],
  [/^atlas\/ds-/, 'Dream symbol medallion', M.disc, 'Discover › Dream Interpretation, dream meaning', 'contain, circle', false, 200],
  [/^atlas\/t-/, 'Tarot menu medallion (keyed from ivory)', M.tarot, 'Tarot landing rows', 'contain', true, 140],
  [/^atlas\/ne-/, 'New-entry menu icon (keyed from ivory)', M.tarot, 'Journal › New Entry', 'contain', true, 140],
  [/^atlas\/hero-(horoscope|tarot|journal|discover|dream|insights)$/, 'Section hero scene (title set as live text above it)', null, 'Section landing', 'cover, anchored top', false, 960],
  [/^atlas\/hero-(chart|affinity|name|lifepath)$/, 'Discover feature hero, framed', M.disc, 'Discover feature pages', 'cover', false, 780],
  [/^atlas\/banner-/, 'Wide dark banner for a Discover tile', M.disc, 'Discover grid (Cosmic Calendar, Astrology Library)', 'cover, anchored left', false, 420],
  [/^atlas\/landscape$/, 'Framed sunset lake and mountains', M.onb, 'Onboarding › account and details footers', 'cover, anchored bottom', false, 960],
  [/^atlas\/kassandra-banner$/, 'Kassandra with lilies on a starry banner', M.home, 'Home › Talk to Kassandra', 'cover, anchored right', false, 960],
  [/^atlas\/kassandra$/, 'Kassandra’s portrait', M.overview, 'Kassandra', 'contain, arch', false, 640],
  [/^atlas\/welcome$/, 'Splash scene: sun, crescent, coastal mountains, flowers', M.onb, 'Onboarding › welcome', 'cover', false, 960],
  [/^atlas\/journal-end$/, 'Woman on a rock under a crescent (closing page)', M.tarot, 'Journal › last page', 'cover', false, 960],
  [/^atlas\/owl$/, 'Snowy owl on a branch before a crescent', M.disc, 'Dream meaning', 'cover', false, 780],
  [/^deck\//, 'Tarot card painting (older pale watercolour style)', M.tarot, 'Tarot readings, Daily Card', 'cover, 2:3', false, 600,
    'Not yet in the mockup’s style (navy skies, gold stars, flowers): to be repainted.'],
  [/^whispers\//, 'Whisper card painting (older pale watercolour style)', M.home, 'Daily Whisper', 'cover, 2:3', false, 600,
    'Not yet in the mockup’s style: to be repainted.'],
  [/^cards\//, 'Card furniture: backs, plaque, crest, ornament', M.home, 'Whisper and tarot cards', 'stretch to card', true, 600],
  [/^pages\//, 'Journal paper, cover and page edges', M.tarot, 'Journal notebook', 'tile / stretch', false, 960],
  [/^moons\//, 'Painted moon phase', M.disc, 'Moon phases, calendars, journal', 'contain, circle', false, 200],
  [/^cats\//, 'Older category icon (settings and a few lists)', null, 'Settings, lists', 'contain', true, 140],
  [/^icons\//, 'Older zodiac icon', null, 'Journal pages, compatibility', 'contain', true, 160],
  [/^spreads\//, 'Tarot spread thumbnail', null, 'Tarot › Card Reading', 'contain', true, 140],
  [/^(frame-paper|frame|onboarding-paper|onboarding|cosmos)$/, 'Paper texture or older ground', null, 'Global parchment', 'tile', false, 960],
];
// folders and files the app no longer references
const UNUSED = new Set(['nav', 'plates', 'scenes', 'frame', 'onboarding-paper', 'onboarding', 'cosmos']);

// assets the mockups need that do not exist yet; they are made in the stage that rebuilds their screen
const MISSING = [
  ['fg-flowers-left, fg-flowers-right', 'Lily and wildflower sprays that overlap the parchment panels at the edges (optional on Home: the sky and vines carry them now)', M.horo, 'Horoscope', 'transparent WebP, 600 px', 'anchored to the panel corners'],
  ['tarot deck in the mockup style ×78', 'Each card on a navy starry ground with gold stars and flowers (The Star as in the mockups)', M.tarot, 'Daily Card, readings, journal', 'opaque WebP 2:3, 800×1200', 'cover'],
  ['whisper cards in the mockup style ×100', 'The Whisper paintings repainted in the same style as the deck', M.home, 'Daily Whisper', 'opaque WebP 2:3, 800×1200', 'cover'],
  ['onboarding scenes ×5', 'Ancient wisdom woman before the moon; account crescent over a lake; details flowers; notifications; welcome panorama', M.onb, 'Onboarding', 'opaque WebP, 1170 px wide', 'cover'],
  ['sign medallions in the creature style ×12', 'The sign wheel’s round, dark medallions (ram, bull, twins …) as in the onboarding board', M.onb, 'Onboarding sign wheel', 'opaque WebP 1:1, 400 px', 'contain'],
  ['journal thumbnails', 'Small square paintings for journal list rows (star card, new moon, love heart, free write)', M.tarot, 'Journal library', 'opaque WebP 1:1, 200 px', 'cover'],
  ['dream symbol thumbnails ×4+', 'Water, forest, moon, flying as square plates', M.disc, 'Dream meaning', 'opaque WebP 4:3, 300 px', 'cover'],
  ['library thumbnails ×7', 'Small square plates for the Astrology Library guides', M.disc, 'Discover › Astrology Library', 'opaque WebP 1:1, 160 px', 'cover'],
  ['avatar placeholder', 'Engraved round portrait frame shown until a photo is uploaded', M.homeTop, 'Home header', 'SVG', 'contain'],
  ['high-density hero masters', 'The painted heroes are 640–1100 px; phones at 3× want 1170 px wide for full-bleed scenes', null, 'All heroes', 'opaque WebP / AVIF', 'cover'],
];

const rows = [], sizes = {};
function walk(dir, rel = '') {
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f), r = rel ? rel + '/' + f : f;
    if (statSync(p).isDirectory()) walk(p, r);
    else if (/\.(webp|png|jpe?g)$/i.test(f)) {
      const id = r.replace(/\.\w+$/, ''), [w, h, alpha] = probe(p), kb = Math.round(statSync(p).size / 1024);
      sizes[id] = [w, h, alpha ? 1 : 0];
      rows.push({ id, file: 'public/art/' + r, w, h, alpha, kb });
    }
  }
}
walk(art);

const ratio = (w, h) => { const g = (a, b) => b ? g(b, a % b) : a, d = g(w, h), x = w / d, y = h / d; return x <= 32 && y <= 32 ? `${x}:${y}` : (w / h).toFixed(2) + ':1'; };
const folderOf = id => id.includes('/') ? id.split('/')[0] : id;
const spec = id => SPEC.find(s => s[0].test(id));

writeFileSync(join(art, 'sizes.js'), '/* generated by scripts/asset-manifest.mjs: [width, height, alpha] of every image under /art */\nwindow.KOSMIA_SIZES=' + JSON.stringify(sizes) + ';\n');

const groups = new Map();
for (const r of rows) {
  const s = spec(r.id), unused = UNUSED.has(folderOf(r.id));
  const status = unused ? 'unused' : APPROVED.has(r.id) ? 'approved' : 'provisional';
  const notes = [];
  if (s && r.w < s[6] && !unused) notes.push(`below the ${s[6]} px it needs at 2×`);
  if (s && s[5] && !r.alpha) notes.push('should be transparent');
  if (s && s[7]) notes.push(s[7]);
  const key = unused ? 'Unused (safe to retire)' : (s ? s[1] : 'Unclassified');
  if (!groups.has(key)) groups.set(key, { s, unused, items: [] });
  groups.get(key).items.push({ ...r, status, notes });
}

let md = `# Kosmia asset manifest

Generated by \`node scripts/asset-manifest.mjs\` from the files in \`public/art\`. The mockups are the approved specification
(\`docs/mockups\`); nothing painted so far has been signed off against them, so every asset in use is **provisional** until
it is. Sizes and transparency are read from the files; \`public/art/sizes.js\` carries them to the app so images reserve
their space before they load.

| | Count |
|---|---|
| Images | ${rows.length} |
| In use, provisional | ${rows.filter(r => !UNUSED.has(folderOf(r.id))).length} |
| Unused | ${rows.filter(r => UNUSED.has(folderOf(r.id))).length} |
| Missing (listed below) | ${MISSING.length} groups |

`;
for (const [title, g] of groups) {
  const it = g.items, s = g.s;
  md += `## ${title}\n\n`;
  if (s && !g.unused) md += `- Mockup: ${s[2] ? '`docs/mockups/' + s[2] + '`' : 'none (no board for this yet)'}\n- Screen: ${s[3]}\n- Crop: ${s[4]}\n- Background: ${s[5] ? 'transparent' : 'opaque'}\n- Wanted width at 2×: ${s[6]} px\n\n`;
  md += `| Asset | Size | Ratio | Alpha | KB | Status | Notes |\n|---|---|---|---|---|---|---|\n`;
  for (const r of it) md += `| \`${r.file}\` | ${r.w}×${r.h} | ${ratio(r.w, r.h)} | ${r.alpha ? 'yes' : 'no'} | ${r.kb} | ${r.status} | ${[...new Set(r.notes)].join('; ')} |\n`;
  md += '\n';
}
md += `## Missing

Needed for a faithful reconstruction and not yet made. Each is made in the stage that rebuilds its screen, and none carries
text, buttons or controls: those are set live over the art.

| Asset | Purpose | Mockup | Screen | Format | Crop |
|---|---|---|---|---|---|
${MISSING.map(m => `| ${m[0]} | ${m[1]} | ${m[2] ? '`docs/mockups/' + m[2] + '`' : '—'} | ${m[3]} | ${m[4]} | ${m[5]} |`).join('\n')}
`;
mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'docs', 'asset-manifest.md'), md);
console.log(`${rows.length} images; sizes.js and docs/asset-manifest.md written`);
