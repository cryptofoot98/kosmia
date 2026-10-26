// GET /api/horoscope?sign=leo&cat=love&period=weekly&key=2026-W44 -> {body, focus, reflection, start, end, sky, written}
// One reading per sign, category and period, written once by OpenAI from that period's real sky (lib: public/sky.js)
// and kept in Netlify Blobs, so every reader of that sign sees the same text and it never changes mid-period.
import { createRequire } from 'node:module';
import { getStore } from '@netlify/blobs';
import { authUser, fail } from '../../lib/supa.mjs';
import '../../public/sky.js'; // reads globalThis.Astronomy only when called
// astronomy-engine's ESM build is not marked as a module, so load its CommonJS build
globalThis.Astronomy = createRequire(import.meta.url)('astronomy-engine');
const K = globalThis.KosmiaSky;

const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
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
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_TEXT_MODEL') || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: 'You write the horoscopes for Kosmia, a vintage, contemplative astrology app whose line is "What if the cosmos is listening?". British English, second person, warm and literate, philosophical and specific rather than generic. Ground the reading in the real sky you are given (name a transit or two and what it traditionally signifies for this sign), but frame astrology as symbolism for reflection: no certainties, no guarantees, no fear, no medical, legal or financial advice, no houses, axes or rising-sign claims (you only know the reader’s Sun sign), dates written in words, no emoji, no clichés such as "the stars align". Reply with JSON only: {"body": "the reading", "focus": "a two-to-four word theme", "reflection": "one reflective question"}.' },
        { role: 'user', content: `Sign: ${name}\nArea of life: ${CATS[cat]}\nPeriod: ${period}, ${span.start} to ${span.end}\nLength: ${LENGTH[period]}\nThe sky (geocentric, tropical zodiac):\n${sky}` }
      ],
      response_format: { type: 'json_object' },
      user: user.id
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'The forecast is still being written. Try again in a moment.');
  }
  let out = {};
  try { out = JSON.parse(body.choices?.[0]?.message?.content || '{}'); } catch {}
  if (!out.body) return fail(502, 'The forecast is still being written. Try again in a moment.');
  const reading = { body: String(out.body).trim(), focus: String(out.focus || '').trim(), reflection: String(out.reflection || '').trim(), start: span.start, end: span.end, sky, written: new Date().toISOString() };
  // first writer wins if two readers ask at the same moment
  await store.setJSON(id, reading, { onlyIfNew: true }).catch(() => {});
  const final = (await store.get(id, { type: 'json' })) || reading;
  return Response.json(final, { headers: { 'cache-control': 'private, max-age=3600' } });
};

export const config = { path: '/api/horoscope', method: 'GET' };
