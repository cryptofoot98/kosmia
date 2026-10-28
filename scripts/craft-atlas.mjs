#!/usr/bin/env node
// Paints the illustrations of the celestial atlas design (public/art/atlas/) with OpenAI, each in the style of the matching
// Kosmia mockup: the mockup crop is sent as a style reference (images/edits); without one, the prompt alone is used.
// Runs locally; the key is read from .env and never leaves this machine.
//
//   node scripts/craft-atlas.mjs --refs <dir of mockup crops>          # make whatever is missing
//   node scripts/craft-atlas.mjs --refs <dir> --ids hero-libra,med-leo  # only these
//   node scripts/craft-atlas.mjs --refs <dir> --force                   # paint again even if present
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'art', 'atlas');
try {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const refs = arg('--refs'), ids = arg('--ids')?.split(','), force = process.argv.includes('--force');
const key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
if (!key) { console.error('craft-atlas: OPENAI_API_KEY is not set (add it to .env)'); process.exit(1); }

const STYLE = 'Style: a richly illustrated vintage celestial tarot card crossed with an antique astronomical engraving and a Victorian fortune-telling poster. Deep midnight-navy night skies scattered with small gold stars, antique gold leaf, warm ivory and parchment, deep burgundy and crimson accents, botanical details (white lilies, daisies, roses, leafy vines). Confident ink outlines with fine engraved hatching and rich painterly colour, luminous, detailed and elegant. Absolutely no text, letters, words, numbers, captions, signatures or watermarks anywhere.';
// figures painted alone on flat grey, to be cut out (scripts/cutout.py) and laid over the scene in front of the card
const FIGSTYLE = 'Style: a richly illustrated vintage celestial tarot card crossed with an antique astronomical engraving: confident ink outlines with fine engraved hatching, rich painterly colour, antique gold, warm ivory, deep burgundy and crimson accents, botanical details. Absolutely no text, letters, numbers, signatures or watermarks.';
const solo = 'The background is a perfectly flat, plain, solid medium grey (#808080) with nothing else on it: no sky, no moon, no halo, no stars, no clouds, no frame, no shadow on the ground.';
const pose = 'Composition: the figure fills the left two-thirds of the square; the head is in the upper left-centre (about 35% from the left, the top of the head about 10% below the top edge), face in three-quarter profile turned to the right and lifted slightly; whatever they hold is raised in front of them towards the right at mid-height; the body, flowing gown and drapery spread to the right along the bottom edge and are cut off by it; white lilies with green leaves at the far left. The upper right third is empty grey background.';
const REF = 'Match the style, palette, line work and finish of the reference image exactly, but paint an entirely new composition as described; do not copy any text or interface elements from it.';
const FIG = {
  aries: 'a bold young woman with a crown of curled golden ram horns and flowing auburn hair, a majestic white ram with spiral horns beside her',
  taurus: 'a serene woman with a crown of roses and long dark curls, resting her hand on a strong white bull garlanded with flowers',
  gemini: 'two graceful twin sisters with flowing hair, shoulder to shoulder, one looking left and one right, holding hands',
  cancer: 'a gentle woman with silver-pearl jewellery and wavy dark hair holding a golden crab-shaped shell, moonlit waves behind her',
  leo: 'a radiant woman with a great golden lion-mane of hair and a sun crown, a proud golden lion at her side',
  virgo: 'a calm maiden with a braided crown of wheat and wildflowers holding a sheaf of golden wheat',
  libra: 'a beautiful woman with long dark curly hair and a flower crown, eyes peacefully closed, holding delicate golden balance scales',
  scorpio: 'a mysterious dark-haired woman in deep crimson with a golden scorpion coiled on her raised hand',
  sagittarius: 'a fearless woman archer drawing a golden bow with a star-tipped arrow, a centaur silhouette among the stars behind her',
  capricorn: 'a majestic mountain goat with great curved horns seated proudly on rocky crags, a sea-goat tail of scales curling around the rocks',
  aquarius: 'a gentle youth with flowing blue-black hair pouring a stream of starry water from a golden urn',
  pisces: 'a dreamy woman with long wavy hair beside two golden koi fish circling each other in shimmering water'
};
const SIGNS = Object.keys(FIG);
const sq = '1024x1024', wide = '1536x1024', tall = '1024x1536';
// the bar at the foot shows its icons at about 30px, so they are bold single objects with nothing around them
const navIcon = 'A single bold, simple engraved icon in dark bronze with a little antique gold, centred with generous margin on a perfectly plain flat light ivory background (#F4EADA); no circle, no frame, no flowers, no scenery, no texture, no shadow; clearly recognisable when shown very small.';
const round = 'A single circular medallion filling the square image edge to edge: a dark midnight-navy disc with a fine antique-gold rim, the subject engraved inside in gold, ivory and sepia with tiny gold stars; plain dark navy outside the circle.';
// the image model paints no transparency, so icons sit on flat ivory, which scripts/key-ivory.py lifts out afterwards
const icon = 'A single small illustrated icon, centred with generous margin, on a perfectly plain flat light ivory background (#F4EADA) with no texture, no frame and no shadow, hand-engraved vintage style with gold, sepia and soft colour.';
const JOBS = [
  // onboarding v2 (docs/mockups/ob2-*): shared layers for the four screens. One sunset for the foot of every screen,
  // the sign chooser's sky, the woman before the moon (sign-up header and the introduction) and the sign-in crescent
  ['ob-sunset', tall, 'obsunset', 'high', 'Tall illustration for the foot of app screens; its upper part will fade into the page. The top 40% is a soft warm dusk sky: peach, amber and rose clouds with a few faint stars, calmer and lighter towards the top edge. A warm amber sun sits low over a calm lake at about 62% of the height, with a bright golden reflection running down the water. Blue-purple mountain silhouettes rise on both sides, small lit Italianate buildings and cypress trees stand on the right shore, and one or two tiny sailing boats float on the lake. In the lower corners and climbing up both side edges are white lilies, daisies, deep red roses and dark green leaves in the foreground. No frame, no border.'],
  ['ob-sky', tall, 'obsky', 'high', 'Tall background for a zodiac sign chooser, with NO medallions, no circles, no text: a deep midnight-navy night sky densely scattered with tiny gold stars and a few large eight-pointed gold sparkle stars; an engraved antique golden sun with a serene face and long fine rays at the top centre (from 2% to 15% of the height); a large golden crescent moon at the upper right edge, partly cut off by it; soft dark blue clouds along the right edge; botanical borders down both full side edges (white lilies, dark green leaves and fine gold vines, about a tenth of the width each). Everything between the borders below 20% of the height is plain dark starry navy.'],
  ['ob-woman', wide, 'obwoman', 'high', 'Wide illustration for the top of a sign-up screen: a deep midnight-navy night sky with tiny gold stars and a few large eight-pointed gold sparkle stars; a huge antique golden full moon with engraved craters on the right half; in front of the moon at the right, a beautiful young woman from the chest up, long flowing curly dark brown hair with white lilies in it, head tilted back and face lifted towards the sky with eyes closed, gold sun earrings and a gold sun pendant, an off-shoulder ivory embroidered blouse; white lilies with green leaves at her lower left; the left 55% is open starry sky (space for a title) with a leafy vine and lilies along the far left edge; along the bottom, soft clouds, dark cypress trees and distant hills at dusk.'],
  ['ob-wisdom', sq, 'obwisdom', 'high', 'Square illustration. The top 32% is a soft glowing cloud of plain warm cream parchment colour (#F3DFC0) in the centre, empty, framed by deep midnight-navy starry sky in the upper corners with leafy vines and small flowers climbing down both side edges. Below it, the centrepiece: a beautiful young woman from the chest up, a little left of centre, long flowing curly dark brown hair with deep red roses and white flowers in it, head tilted back and face lifted with eyes closed, a gold pendant, an off-shoulder ivory embroidered blouse; behind her a huge antique golden full moon with engraved craters; a few large eight-pointed gold sparkle stars at the right; at the right, a calm lake with blue mountains, cypress trees and a small lit town at dusk; white lilies and deep red roses with leaves at the lower left; soft cream clouds along the bottom edge.'],
  ['ob-crescent', wide, 'obcrescent', 'high', 'Wide illustration for the top of a sign-in screen: the top third is a deep midnight-navy starry sky with small gold stars and a few eight-pointed gold sparkles, with a large engraved golden crescent moon at the upper left. The sky dissolves downward through a soft cloudy vignette into plain warm cream parchment (#F3DFC0), which fills the centre and the lower two thirds. White lilies, small flowers and leafy vines sit in the upper right corner and climb down the left and right edges.'],
  // onboarding (docs/mockups/onboarding): the welcome and closing scenes, and the sign wheel's creature medallions
  ['ob-welcome', tall, 'obwel', 'high', 'Tall splash illustration: a deep midnight-navy night sky dense with tiny gold stars; a large engraved antique golden sun with a serene face and long rays at the top centre (from 3% to 26% of the height); a golden crescent moon at the right edge just below it; the band from 28% to 46% of the height is open starry sky with nothing in it; below, a romantic coastal landscape at dusk: a calm bay, a tall dark mountain, a small whitewashed town on the shore, palm trees, soft clouds lit gold; white daisies, lilies and red roses filling the bottom corners. The painting runs edge to edge with no frame, no border and no margin.'],
  ['ob-final', wide, 'obfinal', 'high', 'Wide scenic illustration: a deep navy starry night over a calm lake between dark mountains, a large luminous full moon with engraved craters at the upper left, small gold stars, a little lit town on the far shore, white lilies, daisies, red roses and dark leaves framing the bottom and both sides; the upper middle and right is open starry sky with nothing in it. The painting runs edge to edge with no frame, no border and no margin.'],
  ['zm-aries', sq, 'obsign', 'medium', `${round} The subject: a white ram with great curled golden horns, the emblem of Aries, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-taurus', sq, 'obsign', 'medium', `${round} The subject: a strong bull with gold-tipped horns, the emblem of Taurus, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-gemini', sq, 'obsign', 'medium', `${round} The subject: two twin youths shoulder to shoulder, the emblem of Gemini, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-cancer', sq, 'obsign', 'medium', `${round} The subject: a golden crab, the emblem of Cancer, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-leo', sq, 'obsign', 'medium', `${round} The subject: a proud lion with a flowing golden mane, the emblem of Leo, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-virgo', sq, 'obsign', 'medium', `${round} The subject: a maiden in profile with wheat in her hair, the emblem of Virgo, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-libra', sq, 'obsign', 'medium', `${round} The subject: golden balance scales, the emblem of Libra, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-scorpio', sq, 'obsign', 'medium', `${round} The subject: a golden scorpion with its tail raised, the emblem of Scorpio, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-sagittarius', sq, 'obsign', 'medium', `${round} The subject: a centaur archer drawing a bow, the emblem of Sagittarius, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-capricorn', sq, 'obsign', 'medium', `${round} The subject: a sea-goat with curved horns and a fish tail, the emblem of Capricorn, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-aquarius', sq, 'obsign', 'medium', `${round} The subject: a water bearer pouring from an urn, the emblem of Aquarius, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  ['zm-pisces', sq, 'obsign', 'medium', `${round} The subject: two fish circling each other, the emblem of Pisces, engraved in gold, ivory and sepia, bold and instantly recognisable when small.`],
  // Home (docs/mockups/home-top): the header in layers (sky, halo, the sign's figure), the band behind the Whisper, the
  // Cosmic Energy landscape and the closing sun
  ['home-sky', tall, 'homehdr', 'high', 'Vertical illustration for the header of an app home screen, with NO people and NO figure. Deep midnight-navy night sky densely scattered with tiny gold stars and a few larger eight-pointed gold sparkle stars; a large golden crescent moon in the upper-left corner; a small engraved golden sun with a calm face at the right edge about a fifth of the way down; fine gold vines and leaves curling in from the top corners and down both side edges; soft dark-blue clouds and a faint golden arc at the right edge at about a quarter of the height; tall white lilies with green leaves along the left edge from a quarter to two-thirds of the height; red roses, white daisies and wildflowers along the right edge at about 55 to 65 percent of the height; the centre is open starry sky with nothing in it; the bottom third is dark navy ground with lush dark foliage, lilies and flowers. No frame, no border.'],
  ['home-halo', sq, '', 'medium', 'A perfectly circular golden full moon disc filling the square almost edge to edge: hammered antique gold leaf with faint engraved crater patterns and fine stippling, slightly lighter towards its rim. Plain black outside the circle. Nothing else.'],
  ...SIGNS.map(s => [`fg-${s}`, sq, 'homefig', 'high', `${FIG[s]}. ${pose} ${solo}`, '', 'solo']),
  ['home-vines', tall, '', 'medium', 'Vertical dark midnight-navy background with tiny gold stars: lush botanical borders run down the full left and right edges (white lilies, red roses, daisies, dark green leaves and fine gold vines), each border about a tenth of the width; the centre is plain dark starry navy with nothing in it. No frame, no border.'],
  // the lower Home and Discover (docs/mockups/refine-home-discover): the night lake after the Cosmic Energy landscape, then
  // the closing garden; parchment panels float over their open centres, so the life is at the edges and in the gaps
  ['home-lake', tall, 'hgarden', 'high', 'Vertical scenic illustration with no frame or border, continuing downward from a sunset lake landscape: across the top tenth, dark still lake water with a few last rose-gold reflections, fading quickly into a deep midnight-navy night. Down the full left and right edges, lush botanical borders about a seventh of the width each: pink and white lilies, deep red roses, dark palm fronds, dark green leaves and fine gold vines. Behind the centre, a calm open night: distant dark blue mountains and a still lake with faint gold star reflections at about one third and again at two thirds of the height, small gold stars and a few eight-pointed gold sparkles. The centre is calm, dark and uncluttered.'],
  ['home-garden', tall, 'hgarden', 'high', 'Vertical scenic illustration with no frame or border: a celestial night garden. A deep midnight-navy sky scattered with small gold stars and a few eight-pointed gold sparkles, a thin golden crescent moon high in the centre. Down the full left and right edges, lush botanical borders about a seventh of the width each: pink and white lilies, deep red roses, dark palm fronds, dark green leaves and fine gold vines. At the bottom, a moonlit lake with a faint lit town on the far shore, and along the bottom edge a low stone garden balustrade wreathed with lilies and roses. The centre is calm, dark and uncluttered.'],
  ['home-energy', wide, 'homeenergy', 'high','A wide panoramic sunset landscape running edge to edge, with no frame or border: a calm lake reflecting a peach, rose and violet sky, purple mountains on the left and right, a small glittering coastal town along the far shore, palm fronds and tropical flowers (pink lilies, hibiscus, dark foliage) in the bottom-left and bottom-right corners. The upper third is soft, plain warm sunset sky.'],
  ['home-sun', wide, 'sun', 'medium', 'A wide image on plain aged warm parchment: in the left third a large engraved antique golden sun with a serene face and long straight and wavy rays, fine sepia line engraving with gold leaf; three small gold four-pointed sparkle stars to its right. The right half is plain empty parchment. No frame, no border, no sky.'],
  ...SIGNS.map(s => [`plate-${s}`, tall, 'plate', 'high', `A tall arched illustration in an ornate antique-gold art-nouveau frame with decorative corner flourishes on a parchment surround. Inside the arch: ${FIG[s]}, in front of a large golden full moon and a crescent moon in a starry navy sky, with mountains, a lake and a small coastal town behind and white daisies and lilies in the foreground. Keep a small plain area at the bottom centre of the arch.`]),
  ...SIGNS.map(s => [`med-${s}`, sq, 'meds', 'medium', `${round} The subject: the zodiac sign ${s[0].toUpperCase() + s.slice(1)}, shown as ${FIG[s]}, simplified into a clear, instantly recognisable emblem.`]),
  ['ico-overview', sq, 'icons', 'medium', `${icon} An antique brass compass rose with an eight-pointed star.`],
  ['ico-love', sq, 'icons', 'medium', `${icon} A glossy crimson heart with a gold outline.`],
  ['ico-family', sq, 'icons', 'medium', `${icon} A small cosy stone cottage with a warm lit doorway and a red roof.`],
  ['ico-health', sq, 'icons', 'medium', `${icon} A sprig of green herb leaves.`],
  ['ico-career', sq, 'icons', 'medium', `${icon} A tan leather briefcase with brass clasps.`],
  ['ico-money', sq, 'icons', 'medium', `${icon} A neat stack of antique gold coins.`],
  ['nav-home', sq, '', 'medium', `${navIcon} A sun with straight and wavy rays and a small face.`],
  ['nav-horoscope', sq, '', 'medium', `${navIcon} A crescent moon.`],
  ['nav-tarot', sq, '', 'medium', `${navIcon} Two overlapping tarot cards, the front one with an eye.`],
  ['nav-discover', sq, '', 'medium', `${navIcon} An eight-pointed compass star.`],
  ['nav-kassandra', sq, '', 'medium', `${navIcon} A circle containing a crescent moon with a serene face in profile.`],
  ['ev-eclipse', wide, 'events', 'medium', 'A deep red blood moon (a total lunar eclipse) glowing in a dark navy starry sky with tiny gold stars, engraved style.'],
  ['ev-planet', wide, 'events', 'medium', 'A banded ringed planet with gold and cream bands and engraved rings in a dark navy starry sky with tiny gold stars.'],
  ['ev-full', wide, 'events', 'medium', 'A luminous full moon with engraved craters in a dark navy starry sky with tiny gold stars.'],
  ['ev-new', wide, 'events', 'medium', 'A dark new moon, a faintly outlined dark disc with a thin golden rim of light, in a dark navy starry sky with tiny gold stars.'],
  ['ev-quarter', wide, 'events', 'medium', 'A half-lit quarter moon with engraved craters in a dark navy starry sky with tiny gold stars.'],
  ['ev-sun', wide, 'events', 'medium', 'A radiant engraved golden sun with a calm face and long rays in a dark navy starry sky.'],
  ['ev-meteor', wide, 'events', 'medium', 'Golden shooting stars streaking across a dark navy starry sky over a faint mountain horizon.'],
  ['ex-chart', sq, 'explore', 'medium', `${round} The subject: an engraved golden sun with a serene face and long straight and wavy rays.`],
  ['ex-compat', sq, 'explore', 'medium', `${round} The subject: a woman and a man in profile facing each other, engraved in gold and sepia.`],
  ['ex-resonance', sq, 'explore', 'medium', `${round} The subject: a radiant rose-gold heart with rays bursting around it.`],
  ['ex-lifepath', sq, 'explore', 'medium', `${round} The subject: a small figure climbing a stone stairway towards a bright star, flowers at the foot.`],
  ['ex-name', sq, 'explore', 'medium', `${round} The subject: a sacred-geometry triangle with an eye at its centre inside circles, engraved gold lines.`],
  ['landscape', wide, 'landscape', 'high', 'A wide sunset landscape: a calm bay reflecting a peach and rose sky, purple mountains, a glittering coastal town, palm trees and tropical flowers in the foreground corners, soft warm light.'],
  ['kassandra-banner', wide, 'kban', 'high', 'A wide dark midnight-navy starry banner: white lilies with gold leaves in the lower left corner, and on the right third the head and shoulders of Kassandra, a beautiful fortune teller with dark hair, a golden coin headdress and gold earrings, gazing at the viewer. The centre and left are empty dark starry sky.'],
  ['kassandra', sq, 'kpor', 'high', 'Portrait of Kassandra, a beautiful fortune teller with dark kohl-lined eyes, a red veil and an ornate golden coin headdress, gold earrings and necklaces, against a dark navy sky with gold stars and a crescent moon, head and shoulders, centred.'],
  ['welcome', tall, 'welcome', 'high', 'A woman with long dark curly hair and a flower crown, eyes closed and face lifted to the sky, a crimson shawl embroidered with gold stars over her shoulders, in front of a huge golden full moon; deep navy starry sky with gold stars above her, mountains and cypress trees at the side. Leave the top quarter as open starry sky.'],
  ['hero-horoscope', sq, 'horo', 'high', 'Square header for the Horoscope page. Top: a deep midnight-navy night sky dense with tiny gold stars, a large engraved antique golden sun with a serene face and long straight and wavy rays at the top centre (from 4% to 32% of the height), a golden crescent moon in each upper corner, fine gold vines curling in from the top corners. Middle band (35% to 55% of the height): open starry sky with nothing in it. Bottom 45%: a romantic panorama of a calm bay at dusk with dark mountains and a tall rocky peak, a glittering whitewashed coastal town on the right shore, palm trees, soft clouds lit gold on the horizon, white lilies and red roses in the bottom corners. The painting runs edge to edge with no frame, no border and no margin.'],
  ['hero-tarot', sq, 'tarot', 'high', 'Square header for the Tarot page: a deep navy night sky with tiny gold stars, fine engraved gold arches and concentric celestial circles curving across the upper half, a golden crescent moon and an eight-pointed star at the top centre; an ornate gilded tarot card showing a robed woman leaning at the lower left; tall white lilies, red roses and dark leaves along the right edge and the bottom; the centre (35% to 60% of the height) is open starry sky. The painting runs edge to edge with no frame, no border and no margin.'],
  ['hero-journal', sq, 'journal', 'high', 'Square header for the Journal page: a luminous full moon with engraved craters high in a deep navy starry sky at the top centre, a faint gold circle around it; jagged snow-touched mountains on both sides reflected in a perfectly still lake that fills the lower half, a golden path of moonlight on the water; white lilies and dark leaves curling in from the upper corners, red roses and daisies at the lower corners. The band from 40% to 62% of the height is calm and uncluttered. The painting runs edge to edge with no frame, no border and no margin.'],
  ['hero-discover', sq, 'discover', 'high', 'Square header for the Discover page: a deep midnight-navy night sky dense with tiny gold stars, a large golden crescent moon at the upper left, a bright eight-pointed star and a faint gold shooting star at the upper right, fine gold vines curling in from the top corners; the band from 12% to 48% of the height is open starry sky with nothing in it; the lower half is a moonlit lake between dark mountains and pine forests, a hillside town of warm-lit villas and a bell tower on the right shore, white lilies, daisies and red roses in the bottom corners. The painting runs edge to edge with no frame, no border and no margin.'],
  ['cal-scene', wide, 'calendar', 'medium', 'A wide vintage engraved landscape on warm aged parchment: a calm lake with a Mediterranean villa and terraces on the right shore, tall cypress trees, an old stone town with a bell tower, distant blue mountains, wildflowers and leafy branches in the bottom-left corner. The sky is pale parchment that fades softly into plain parchment at the top, with no hard edge. Delicate ink lines and soft muted watercolour. No frame, no border.'],
  ['hero-dream', wide, 'dream', 'high', 'A woman with long dark hair sleeping peacefully on soft blue and gold clouds under a crescent moon and gold stars, flowers around her, navy night sky.'],
  ['hero-insights', wide, 'insights', 'medium', 'Wide header: a deep navy night sky with tiny gold stars; a large engraved golden sun-and-moon face (half sun with rays, half dark crescent moon, serene profile) at the upper right; white lilies, red roses, daisies and gold vines in the lower left corner and along the bottom; the centre and left are open starry sky. The painting runs edge to edge with no frame, no border and no margin.'],
  ['ce-vignette', tall, 'horo', 'medium', 'A tall arched vignette: a dark midnight-navy starry night inside a slim antique-gold arched frame, the centre of the arch open and empty (for a moon to be set in later), lush red and pink roses, white daisies and green leaves filling the bottom third and climbing a little up both sides of the frame. Outside the frame, plain parchment.'],
  ['journal-end', tall, 'jend', 'high', 'A woman with long dark hair in a crimson shawl sitting on rocks seen from behind, looking across a bay to a lit coastal town and mountains at night, a crescent moon and gold stars above, flowers and vines framing the sides. Leave the upper third as open starry sky.'],
  ['hero-chart', wide, 'chart', 'high', 'An engraved golden sun with a serene face at the centre of an antique zodiac ring of plain gold segments, over soft clouds, in a navy starry sky.'],
  ['hero-affinity', wide, 'affinity', 'high', 'A golden sun with a woman’s face in profile on the left and a pale crescent moon with a man’s face in profile on the right, facing each other, among flowers and gold stars on navy.'],
  ['hero-name', wide, 'name', 'high', 'A woman with long dark curly hair and flowers in her hair, in profile, in front of a large antique engraved astrolabe wheel, white lilies, navy sky with gold stars.'],
  ['hero-lifepath', wide, 'lifepath', 'high', 'A woman in a red cloak walking along a winding stone path through a valley of flowers and pines towards distant mountains and a glowing golden sun.'],
  ['owl', wide, 'owl', 'high', 'A white snowy owl perched on a branch in front of a large crescent moon, white lilies, navy starry sky.'],
  ['banner-calendar', wide, 'calendar', 'medium', 'A dark navy starry banner with a row of moon phases from crescent to full to crescent across it in luminous gold and ivory, and a small ringed planet at one end.'],
  ['banner-library', wide, 'library', 'medium', 'A stack of antique leather books with gold tooling, a brass telescope and a small celestial globe on a desk under a navy starry sky.'],
  ['t-whisper', sq, 'tlist', 'medium', `${icon} A round bronze medallion with an eight-pointed star.`],
  ['t-reading', sq, 'tlist', 'medium', `${icon} A round bronze medallion holding a small tarot card with a star.`],
  ['t-journal', sq, 'tlist', 'medium', `${icon} A round bronze medallion holding a small tarot card with a figure.`],
  ['t-history', sq, 'tlist', 'medium', `${icon} A round bronze medallion holding an open antique book.`],
  ['ne-card', sq, 'newent', 'medium', `${icon} A small stack of two tarot cards with a gold diamond motif.`],
  ['ne-free', sq, 'newent', 'medium', `${icon} A tarot card with a feather quill resting across it.`],
  ['ds-water', sq, 'dsym', 'medium', `${round} The subject: calm blue water waves under a small golden pyramid-shaped wave crest.`],
  ['ds-flying', sq, 'dsym', 'medium', `${round} The subject: a single golden feathered wing.`],
  ['ds-snake', sq, 'dsym', 'medium', `${round} The subject: a coiled golden snake.`],
  ['ds-house', sq, 'dsym', 'medium', `${round} The subject: a small cottage with a lit window.`],
  ['ds-death', sq, 'dsym', 'medium', `${round} The subject: a white moth with open wings, a symbol of transformation.`]
];

async function paint([id, size, ref, quality, prompt, background, kind]) {
  const text = `${prompt}\n${kind === 'solo' ? FIGSTYLE : STYLE}`;
  const refPath = refs && ref && join(refs, ref + '.png');
  const opts = { model, size, quality, output_format: 'webp', output_compression: '86', ...(background ? { background } : {}) };
  let res;
  if (refPath && existsSync(refPath)) {
    const f = new FormData();
    f.append('prompt', `${REF}\n${text}`);
    for (const [k, v] of Object.entries(opts)) f.append(k, String(v));
    f.append('image[]', new Blob([readFileSync(refPath)], { type: 'image/png' }), ref + '.png');
    res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { authorization: `Bearer ${key}` }, body: f });
  } else {
    res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ ...opts, output_compression: 86, prompt: text, n: 1 }) });
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
  return Buffer.from(body.data[0].b64_json, 'base64');
}

mkdirSync(out, { recursive: true });
const jobs = JOBS.filter(([id]) => (!ids || ids.includes(id)) && (force || !existsSync(join(out, id + '.webp'))));
console.log(`craft-atlas: ${jobs.length} image(s) to paint with ${model}${refs ? ' (mockup references)' : ''}`);
let failed = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: 6 }, async () => {
  for (let job; (job = queue.shift());) {
    try { writeFileSync(join(out, job[0] + '.webp'), await paint(job)); console.log(`  ✓ ${job[0]}`); }
    catch (e) { failed++; console.error(`  ✗ ${job[0]}: ${e.message}`); }
  }
}));
console.log(`craft-atlas: ${readdirSync(out).length} images in public/art/atlas${failed ? `, ${failed} failed (run again to retry)` : ''}`);
process.exit(failed ? 1 : 0);
