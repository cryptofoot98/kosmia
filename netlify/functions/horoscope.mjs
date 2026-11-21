// GET /api/horoscope?sign=leo&cat=love&period=weekly&key=W2026-11-01 -> {body, focus, reflection, start, end, sky, written}
// One reading per sign, category and period, written once by Claude from that period's real sky (lib: public/sky.js)
// and kept in Netlify Blobs, so every reader of that sign sees the same text and it never changes mid-period.
import { createRequire } from 'node:module';
import { getStore } from '@netlify/blobs';
import { authUser, fail } from '../../lib/supa.mjs';
import { write, obj, str, list } from '../../lib/claude.mjs';
import '../../public/sky.js'; // reads globalThis.Astronomy only when called
// astronomy-engine's ESM build is not marked as a module, so load its CommonJS build
globalThis.Astronomy = createRequire(import.meta.url)('astronomy-engine');
const K = globalThis.KosmiaSky;

const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
// each sign's traditional nature, so every forecast is unmistakably that sign's
const NATURE = {
  aries: 'cardinal fire ruled by Mars: courageous, direct, pioneering, impatient, alive in beginnings',
  taurus: 'fixed earth ruled by Venus: steady, sensual, loyal, patient, slow to change, at home in beauty and comfort',
  gemini: 'mutable air ruled by Mercury: curious, quick, sociable, many-sided, restless, alive in words and ideas',
  cancer: 'cardinal water ruled by the Moon: tender, protective, intuitive, rooted in home, memory and family',
  leo: 'fixed fire ruled by the Sun: warm, generous, proud, creative, playful, wanting to shine and to be seen',
  virgo: 'mutable earth ruled by Mercury: careful, devoted, practical, discerning, prone to worry, healing through service and craft',
  libra: 'cardinal air ruled by Venus: graceful, fair, diplomatic, seeking harmony and partnership, sometimes indecisive',
  scorpio: 'fixed water ruled by Pluto and Mars: deep, intense, private, loyal, transformative, unafraid of the truth',
  sagittarius: 'mutable fire ruled by Jupiter: free, hopeful, adventurous, honest, searching for meaning and horizons',
  capricorn: 'cardinal earth ruled by Saturn: ambitious, patient, responsible, quietly humorous, building for the long term',
  aquarius: 'fixed air ruled by Saturn and Uranus: original, independent, humane, visionary, at once detached and devoted to others',
  pisces: 'mutable water ruled by Jupiter and Neptune: dreamy, compassionate, intuitive, artistic, porous to the feelings of others'
};
const CATS = {
  overview: 'the overall tone of the period across life as a whole',
  love: 'love and close relationships: partners, dating, intimacy, friendship and self-love',
  family: 'family and home: relatives, roots, the household, children and the people you live with',
  health: 'wellbeing habits: rest, energy, routine, stress and care for the body and mind. Never give medical advice or claims',
  career: 'work and vocation: projects, colleagues, ambition, learning and direction',
  money: 'money habits and values: budgeting, spending, saving, generosity and security. Never give financial advice, tips or predictions of gains or losses'
};
const LENGTH = { daily: '80 to 120 words', weekly: '120 to 170 words', monthly: '170 to 230 words', yearly: '240 to 320 words in three short paragraphs' };

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for the full forecast');
  const q = new URL(req.url).searchParams;
  const sign = q.get('sign'), cat = q.get('cat'), period = q.get('period'), key = q.get('key');
  if (!SIGNS.includes(sign) || !CATS[cat] || !LENGTH[period]) return fail(400, 'Unknown forecast');
  // only periods that are current somewhere on Earth, so nobody can make the server write future or past forecasts
  const span = K.periodFromKey(period, key || '');
  if (!span || !K.liveKeys(period).has(key)) return fail(400, 'That period is not open');

  const store = getStore('horoscopes');
  const id = `${period}/${key}/${sign}/${cat}`;
  const kept = await store.get(id, { type: 'json' });
  if (kept) return Response.json(kept, { headers: { 'cache-control': 'private, max-age=3600' } });

  const sky = K.summary(span.start, span.end);
  const name = sign[0].toUpperCase() + sign.slice(1);
  let out = {};
  try {
    out = await write({
      user: user.id,
      effort: 'medium',
      schema: obj({ body: str, focus: str, reflection: str }),
      system: 'You write the horoscopes for Kosmia, a vintage, contemplative astrology app whose line is "What if the cosmos is listening?". British English, second person, warm and literate, philosophical and specific rather than generic. Ground the reading in the real sky you are given (name a transit or two and what it traditionally signifies for this sign), always positive and constructive (a challenging transit is an invitation to grow, with one small practical step), but frame astrology as symbolism for reflection: no certainties, no guarantees, no fear, no medical, legal or financial advice, no houses, axes or rising-sign claims (you only know the reader’s Sun sign), dates written in words, no emoji, no clichés such as "the stars align". Reply with JSON only: {"body": "the reading", "focus": "a two-to-four word theme", "reflection": "one reflective question"}.',
      messages: [{ role: 'user', content: `Sign: ${name}, ${NATURE[sign]}. Let the reading speak to this nature, so a ${name} recognises themselves in it and it could not belong to another sign.\nArea of life: ${CATS[cat]}\nPeriod: ${period}, ${span.start} to ${span.end}\nLength: ${period === 'daily' && cat === 'overview' ? '55 to 75 words' : LENGTH[period]}\nThe sky (geocentric, tropical zodiac):\n${sky}` }]
    });
  } catch (e) {
    console.error(e.message);
    return fail(502, 'The forecast is still being written. Try again in a moment.');
  }
  if (!out.body) return fail(502, 'The forecast is still being written. Try again in a moment.');
  const reading = { body: String(out.body).trim(), focus: String(out.focus || '').trim(), reflection: String(out.reflection || '').trim(), start: span.start, end: span.end, sky, written: new Date().toISOString() };
  // first writer wins if two readers ask at the same moment
  await store.setJSON(id, reading, { onlyIfNew: true }).catch(() => {});
  const final = (await store.get(id, { type: 'json' })) || reading;
  return Response.json(final, { headers: { 'cache-control': 'private, max-age=3600' } });
};

export const config = { path: '/api/horoscope', method: 'GET' };
