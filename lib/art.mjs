// Image prompts shared by the crafting script (scripts/craft-images.mjs) and
// the /api/paint function, so crafted art and user paintings share one look.

export const STYLE = 'Kosmia house style: vintage hand-engraved sepia ink line art with fine hatching and stippling, softened by faded watercolour washes in ochre, umber, muted rose-brown and antique gold (#8B6A3E), on aged warm parchment (#EFE3CE). Celestial and botanical motifs, quiet antique elegance, calm and luminous. No text, no letters, no numbers, no border, no signature, no watermark.';

import '../public/whispers.js';
import '../public/tarot.js';

// The full 78-card tarot deck (public/tarot.js); each card's art scene is painted in the same collage style.
export const DECK = globalThis.KOSMIA_TAROT;

// The 55 whispers (daily cards); ORACLE maps id -> [title, art motif] for the prompts below.
export const WHISPERS = globalThis.KOSMIA_WHISPERS;
export const ORACLE = Object.fromEntries(WHISPERS.map(w => [w[0], [w[1], w[5]]]));

export const TAROT = ['The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World'];

export const SIGNS = {
  aries: ['Aries', 'a ram', 'Fire'], taurus: ['Taurus', 'a bull', 'Earth'], gemini: ['Gemini', 'twin figures', 'Air'],
  cancer: ['Cancer', 'a crab', 'Water'], leo: ['Leo', 'a lion', 'Fire'], virgo: ['Virgo', 'a maiden holding wheat', 'Earth'],
  libra: ['Libra', 'balanced scales', 'Air'], scorpio: ['Scorpio', 'a scorpion', 'Water'], sagittarius: ['Sagittarius', 'an archer centaur', 'Fire'],
  capricorn: ['Capricorn', 'a sea-goat', 'Earth'], aquarius: ['Aquarius', 'a water bearer', 'Air'], pisces: ['Pisces', 'two fish circling', 'Water']
};

// Dashboard horoscope backdrops: one portrait scene per sign, the subject high in the frame.
export const SCENES = {
  aries: 'a ram with great curled horns in three-quarter view, standing beside clusters of tall crystals, a thin crescent arc and scattered stars behind',
  taurus: 'the head of a bull with long curved horns, roses and peonies blooming at one side, a pale full moon disc behind',
  gemini: 'two young women in profile, back to back, flowers woven in their hair, soft clouds and a crescent moon behind them',
  cancer: 'a crab beneath a large full moon over a calm shoreline, water lilies at the water\'s edge',
  leo: 'the head of a lion with a great flowing mane, framed by leafy vines and fern fronds',
  virgo: 'a young woman in profile holding lavender and wildflowers, flowers in her hair, a crescent moon behind',
  libra: 'ornate balance scales hanging level before a full moon among soft clouds, small stars around',
  scorpio: 'a scorpion with raised tail beside a crescent moon and a single rose',
  sagittarius: 'a drawn bow with a nocked arrow and trailing feathers, a small full moon beside it',
  capricorn: 'a wild mountain goat standing on a rocky ledge among tall jagged peaks',
  aquarius: 'a young woman with long hair pouring a stream of water from an urn, stars around her',
  pisces: 'two koi fish circling one another head to tail within a faint ring of stars'
};

// The back of every card: a night-sky lunar chart, the one dark object in the parchment app.
export const CARD_BACK = 'Vertical card-back design, full bleed and symmetrical: an antique celestial chart on deep midnight-navy paper with a worn, aged texture. Down the centre, a vertical sequence of the phases of the Moon, from crescent to a large full moon in the middle and back to crescent, rendered in luminous antique gold with engraved crater detail. Behind them, fine gold concentric orbit rings, faint constellation lines and scattered gold stars. A small engraved astrolabe roundel in each corner, an eight-pointed compass star at the top, bottom and both sides, and delicate gold acanthus foliage in the corners, all inside a thin gold double border. No text, no handwriting, no letters, no numbers, no signature, no watermark.';

// Whisper card fronts, one per whisper, in the style of a layered vintage mixed-media tarot. Figure, setting,
// palette and flowers rotate with different steps across the 55 so neighbouring cards never look alike.
const FIGURES = ['a robed woman with long dark curling hair, eyes closed', 'an elder sage with a silver beard and a staff', 'a young man in a woven travelling cloak', 'a dancer caught mid-turn, veils flowing', 'two figures facing one another, hands almost touching', 'a crowned figure seated on a carved stone throne', 'a traveller holding up a glowing lantern', 'a child releasing a bird into the sky', 'no person at all: symbolic objects, animals and plants alone'];
const SETTINGS = ['classical ruins with columns and cypress trees', 'a mountain citadel above a waterfall', 'a moonlit coastline with sea cliffs', 'a desert oasis with palms and a still pool', 'a forest temple among ferns and old roots', 'a river valley crossed by an old stone bridge', 'snowy peaks beneath a shimmering aurora', 'terraced gardens with fountains', 'a harbour town at dusk with sailing ships', 'a meadow of wildflowers under a vast sky'];
const PALETTES = ['terracotta, cream and deep navy', 'sage green, ochre and gold', 'rose, burgundy and ivory', 'indigo, silver and pale gold', 'amber, rust and umber', 'teal, sand and copper'];
const FLORA = ['white lilies', 'roses', 'olive branches', 'lotus flowers', 'poppies', 'lavender', 'trailing ivy', 'orange blossom'];

export function whisperPrompt(i) {
  const [, title, , , , motif] = WHISPERS[i];
  return `Vertical tarot card artwork, full bleed, in the style of a richly layered vintage mixed-media collage: torn-paper edges, layers of aged parchment and textured handmade paper, a gold-leaf halo or sun disc, a deep starry night sky with crescent moons and gold stars, fine engraved detail and gold accents. Theme: the card "${title}", ${motif}. Scene: ${FIGURES[i % 9]} amid ${SETTINGS[(i * 3 + 1) % 10]}, with ${FLORA[(i * 5 + 2) % 8]}. Palette: ${PALETTES[(i * 7 + 3) % 6]}. Keep the lower quarter calmer and simpler, as a text plaque will sit over it. No text, no letters, no numbers, no title, no frame or border, no signature, no watermark.`;
}

export function deckPrompt(card) {
  const palette = card.palette || 'terracotta, cream, deep navy and gold';
  return `Vertical tarot card illustration, full bleed, for the card "${card.artTitle || card.name}", in the style of a richly layered vintage mixed-media collage: torn-paper layers of aged parchment, terracotta and cream textured paper and lace, a deep navy starry night sky with gold stars and crescent moons, gold-leaf halos or sun discs, fine engraved detail, Mediterranean mountains, cypress trees and classical ruins. Scene: ${card.art}. Accent palette: ${palette}. Traditional tarot symbolism, serene and beautiful. No text, no letters, no numbers, no title, no border or frame, no signature, no watermark.`;
}

// Every crafted image as [folder, file id, prompt, size?]. Square card art unless a size is given.
export function craftList() {
  const c = 'Square composition, the subject centred with generous ivory space around it. ';
  const p = 'Portrait composition: the subject fills the upper half of the frame and the lower half fades softly into plain blank parchment, leaving room for text. ';
  return [
    ['cards', 'back', CARD_BACK, '1024x1536'],
    ...DECK.map(c => ['deck', c.id, deckPrompt(c), '1024x1536']),
    ...WHISPERS.map((w, i) => ['whispers', w[0], whisperPrompt(i), '1024x1536']),
    ...Object.entries(SCENES).map(([id, scene]) => ['scenes', id, `${p}Illustration for the zodiac sign ${SIGNS[id][0]}: ${scene}. ${STYLE}`, '1024x1536']),
    ...Object.entries(ORACLE).map(([id, [title, motif]]) => ['oracle', id, `${c}Oracle card illustration for "${title}": ${motif}. ${STYLE}`]),
    ...TAROT.map((name, i) => ['tarot', 'm' + i, `${c}Tarot major arcana illustration for "${name}", its traditional symbolism reimagined gently and without menace. ${STYLE}`]),
    ...Object.entries(SIGNS).map(([id, [name, emblem, el]]) => ['signs', id, `${c}Zodiac emblem for ${name}: ${emblem}, with the ${name} constellation traced in fine gold stars and a hint of the ${el} element. ${STYLE}`])
  ];
}

// The personal painting a user can ask for on their daily card. Inputs are ids,
// validated against the tables above, so users never send free-form prompts.
export function paintPrompt(cardId, signId) {
  const card = ORACLE[cardId], sign = SIGNS[signId];
  if (!card || !sign) return null;
  return `Portrait-format personal oracle painting for a ${sign[0]}, inspired by the card "${card[0]}": ${card[1]}. Weave in ${sign[1]} and the ${sign[0]} constellation subtly, with the mood of the ${sign[2]} element. A full illustrated scene, richer than a single emblem. ${STYLE}`;
}
