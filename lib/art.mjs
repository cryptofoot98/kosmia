// Image prompts shared by the crafting script (scripts/craft-images.mjs) and
// the /api/paint function, so crafted art and user paintings share one look.

export const STYLE = 'Kosmia house style: delicate hand-engraved line art in antique gold (#C5A477) with soft mauve (#7E6280) and dusty rose (#E8CBD2) washes, on warm ivory paper (#FFF9F2). Celestial and botanical motifs, fine stippling and hatching, quiet art-nouveau elegance, calm and luminous. No text, no letters, no numbers, no border, no watermark.';

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

// Every crafted image as [folder, file id, prompt]. Square, centred, made to sit inside a card face.
export function craftList() {
  const c = 'Square composition, the subject centred with generous ivory space around it. ';
  return [
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
