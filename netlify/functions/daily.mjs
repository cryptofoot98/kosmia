// POST /api/daily {day, name, sign, natal, sky, story, memory, card:{id,title,msg,ref,words}}
//   -> {body, focus, question, whisper, carry:[3], ncarry:[2], memory}
// POST /api/daily {day, evening:true, carried, name, sign, story, memory, card} -> {reflect, ncarry:[2]}
// The reader's own day, written by Claude from their story: what Kosmia has come to know of them over time (memory, which
// Claude rewrites each morning so it deepens with every day of use) and the last three weeks in their own words (cards
// turned, what they chose to carry, reflections, journal pages, questions to the cards, dreams, what they told Kassandra).
// Morning: the message, the Whisper's personal note, three things to carry and the evening question. Evening: a question
// about how the day went, written from what they chose to carry, and two things to carry into the night.
// Kept in Netlify Blobs per reader and day (a new page written earns a fresh one); the app falls back to its own words.
import { getStore } from '@netlify/blobs';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import { write, obj, str, list } from '../../lib/claude.mjs';

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const block = (s, n) => String(s || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, n);   // keeps the lines
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const VOICE = 'You write for one reader of Kosmia, a vintage, mystic astrology and tarot app ("The universe speaks. Are you listening?"), a quiet sanctuary they visit every day: a Whisper card in the morning, a message written for them, one thing to carry through the day, and a reflection in the evening. Your words are where they feel known. Write as if speaking to their soul: warm, intimate, poised British English, second person. Below is their story: what Kosmia has come to understand of them over time, and their recent days in their own words. Read all of it. Draw on the specific things they wrote, chose and asked (a person they named, a hope, a worry, a question to the cards, a dream, what they carried yesterday and how it went), and let today follow on from yesterday, so they feel accompanied over time, not read once. The longer they have been with Kosmia, the deeper and more particular you may be. Never quote them back word for word at length, never list what they did, never imply you are watching them: speak like a wise friend who remembers. ALWAYS positive and focused on self-development: reframe worries as growth, name a strength they already have, offer small, kind, practical steps. Never fearful, no predictions of certainty, no medical, legal, financial or crisis advice, no diagnoses, no emoji, no clichés such as "the stars align". If they seem to be in real distress, be tender and gently suggest reaching out to someone they trust. If they have written nothing yet, welcome them warmly and invite them to begin.';

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for your personal reading');
  const o = await req.json().catch(() => ({}));
  if (!/^\d{4}-\d\d-\d\d$/.test(o.day || '') || !SIGNS.includes(o.sign)) return fail(400, 'Unknown day');
  // only a day that is today somewhere on Earth
  if (Math.abs(Date.parse(o.day + 'T12:00:00Z') - Date.now()) > 1.6 * 864e5) return fail(400, 'That day is not open');
  const story = block(o.story || o.portrait, 9000), memory = block(o.memory, 1500), card = o.card || {}, carried = clip(o.carried, 120);

  const store = getStore('daily');
  const id = o.evening ? `${user.id}/${o.day}/eve/${hash(carried)}` : `${user.id}/${o.day}/${story.length}`;
  const kept = await store.get(id, { type: 'json' });
  if (kept) return Response.json(kept);
  if (!(await claim(user, 'daily', limit('DAILY_LIMIT', 8)))) return fail(429, 'Your day is already written');

  const known = [
    `Reader: ${clip(o.name, 40) || 'unnamed'}, Sun sign ${o.sign}.`,
    o.natal ? `Birth chart: ${clip(o.natal, 500)}` : '',
    o.sky ? `Today (${o.day}): ${clip(o.sky, 300)}` : `Today is ${o.day}.`,
    `Today's Whisper card: "${clip(card.title, 60)}": ${clip(card.msg, 300)} Its evening question: ${clip(card.ref, 200)} Keywords: ${clip((card.words || []).join(', '), 80)}`,
    memory ? `What Kosmia has come to understand of them over time:\n${memory}` : 'Kosmia has no long-term understanding of them yet.',
    story ? `Their story:\n${story}` : 'They have not written anything yet.'
  ].filter(Boolean).join('\n\n');

  let out = {};
  try {
    out = o.evening
      ? await write({
          user: user.id,
          effort: 'medium',
          schema: obj({ reflect: str, ncarry: list(str) }),
          system: VOICE + ' It is now evening. ' + (carried ? `This morning they chose to carry through the day: "${carried}".` : 'They did not choose anything to carry today.') + ' Reply with JSON only: {"reflect": "one evening reflection question, 12 to 30 words, that asks gently how the day went, tied to what they carried and to what has been on their mind; never generic", "ncarry": ["two short, gentle things to carry into the night, under 12 words each, drawn from their day and their story"]}.',
          messages: [{ role: 'user', content: known }]
        })
      : await write({
          user: user.id,
          effort: 'medium',
          schema: obj({ body: str, focus: str, question: str, whisper: str, carry: list(str), ncarry: list(str), memory: str }),
          system: VOICE + ' Write this morning\'s words. Use their first name once in the body. This is a brand-new message for this day: take a fresh angle from yesterday\'s. Reply with JSON only: {"body": "the day\'s message, 80 to 120 words, connected to their own life and to today\'s sky", "focus": "a two-to-four word theme", "question": "the question they will meet in the evening reflection, 12 to 30 words, personal and specific to them", "whisper": "two or three sentences, under 60 words, in the voice of an oracle: mysterious, powerful and mystical, telling them why this Whisper card came to them today, connected to what they are living; always hopeful", "carry": ["three different things to carry through today, each under 12 words, small, concrete and kind, drawn from their life (for example something to say to a person they mentioned, or a step toward a hope they wrote about)"], "ncarry": ["two gentle things to carry into the night, under 12 words each"], "memory": "Kosmia\'s private notes on who this reader is, 80 to 160 words, in the third person: rewrite the earlier understanding together with what their story adds, keeping what still matters (people, hopes, worries, patterns, what helps them, how they have grown) and letting go of what has passed. Only what they wrote or chose; never guess at health or other sensitive matters"}.',
          messages: [{ role: 'user', content: known }]
        });
  } catch (e) {
    console.error(e.message);
    return fail(502, 'Your day is still being written.');
  }
  const lines = (a, n, w) => (Array.isArray(a) ? a : []).map(x => clip(x, w)).filter(Boolean).slice(0, n);
  let day;
  if (o.evening) {
    if (!out.reflect) return fail(502, 'Your evening is still being written.');
    day = { reflect: clip(out.reflect, 240), ncarry: lines(out.ncarry, 2, 90), written: new Date().toISOString() };
  } else {
    if (!out.body) return fail(502, 'Your day is still being written.');
    day = { body: clip(out.body, 1400), focus: clip(out.focus, 60), question: clip(out.question, 240), whisper: clip(out.whisper, 500), carry: lines(out.carry, 3, 90), ncarry: lines(out.ncarry, 2, 90), memory: clip(out.memory, 1400), written: new Date().toISOString() };
  }
  await store.setJSON(id, day).catch(() => {});
  return Response.json(day);
};

export const config = { path: '/api/daily', method: 'POST' };
