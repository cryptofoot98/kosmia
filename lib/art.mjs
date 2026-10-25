// Image prompts shared by the crafting script (scripts/craft-images.mjs) and
// the /api/paint function, so crafted art and user paintings share one look.

export const STYLE = 'Kosmia house style: vintage hand-engraved sepia ink line art with fine hatching and stippling, softened by faded watercolour washes in ochre, umber, muted rose-brown and antique gold (#8B6A3E), on aged warm parchment (#EFE3CE). Celestial and botanical motifs, quiet antique elegance, calm and luminous. No text, no letters, no numbers, no border, no signature, no watermark.';

export const ORACLE = {
  'open-path': ['The Open Path', 'a winding path climbing gently through hills toward a single bright star'],
  'quiet-moon': ['The Quiet Moon', 'a slender crescent moon resting in a hush of dark-blue night and soft clouds'],
  'rising-sun': ['The Rising Sun', 'a sun just clearing the horizon, long rays fanning over a still sea'],
  'steady-star': ['The Steady Star', 'a four-pointed guiding star above a small boat on calm water'],
  'inner-key': ['The Inner Key', 'an ornate antique key held in open cupped hands, glowing softly'],
  'late-bloom': ['The Late Bloom', 'a single flower opening in an autumn garden while other stems rest'],
  'watchful-eye': ['The Watchful Eye', 'a serene open eye framed by a crescent and scattered stars'],
  'distant-ship': ['The Distant Ship', 'a sailing ship far out on the horizon heading toward a lit harbour'],
  'old-tree': ['The Old Tree', 'an ancient tree with deep roots visible beneath the earth, stars in its branches'],
  'turning-wheel': ['The Turning Wheel', 'a wheel of the four seasons, spring blossom to winter frost around its rim'],
  'white-lily': ['The White Lily', 'a white lily in soft moonlight with dew on its petals'],
  'clear-crystal': ['The Clear Crystal', 'a faceted quartz crystal catching starlight and splitting it into soft colour']
};

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

// Every crafted image as [folder, file id, prompt, size?]. Square card art unless a size is given.
export function craftList() {
  const c = 'Square composition, the subject centred with generous ivory space around it. ';
  const p = 'Portrait composition: the subject fills the upper half of the frame and the lower half fades softly into plain blank parchment, leaving room for text. ';
  return [
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
