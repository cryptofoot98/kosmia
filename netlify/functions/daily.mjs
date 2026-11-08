// POST /api/daily {day, name, sign, natal, sky, portrait, card:{id,title,msg,words}} -> {body, focus, question, whisper}
// The reader's own day, written once by OpenAI from what they have been writing about (the portrait their device draws
// from their journal, reflections, tarot questions and dreams), today's sky and their birth chart, and the Whisper card
// they drew. Kept in Netlify Blobs for that reader and day, so it reads the same all day; the app falls back to its own
// personal message when this cannot be written.
import { getStore } from '@netlify/blobs';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for your personal reading');
  const o = await req.json().catch(() => ({}));
  if (!/^\d{4}-\d\d-\d\d$/.test(o.day || '') || !SIGNS.includes(o.sign)) return fail(400, 'Unknown day');
  // only a day that is today somewhere on Earth
  if (Math.abs(Date.parse(o.day + 'T12:00:00Z') - Date.now()) > 1.6 * 864e5) return fail(400, 'That day is not open');
  const portrait = clip(o.portrait, 1600), card = o.card || {};

  // one reading per reader, day and portrait (a new journal page earns a fresh one)
  const store = getStore('daily');
  const id = `${user.id}/${o.day}/${String(portrait.length)}`;
  const kept = await store.get(id, { type: 'json' });
  if (kept) return Response.json(kept);
  if (!(await claim(user, 'daily', limit('DAILY_LIMIT', 6)))) return fail(429, 'Your day is already written');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_TEXT_MODEL') || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: 'You write the daily personal message for one reader of Kosmia, a vintage, mystic astrology and tarot app ("The universe speaks. Are you listening?"). You are given what the reader has recently been writing about in their journal, their reflections and the questions they asked the cards, plus today\'s real sky and their birth chart. Write as if speaking to their soul: warm, intimate, poised British English, second person, using their first name once. Weave in one or two of their own themes (from their journal, their reflections, the questions they asked the cards and what they told Kassandra), gently and specifically, without quoting them back word for word and without ever implying you are monitoring them. This is a brand-new message for this day: take a fresh angle, never a generic one. ALWAYS positive and focused on self-development: help them become, today, a little more of their best self; reframe worries as growth, name a strength they already have, and offer one small, kind, practical step. Never fearful, never predictive certainty, no medical, legal, financial or crisis advice, no diagnoses, no emoji, no clichés such as "the stars align". If they seem to be in real distress, be tender and suggest reaching out to someone they trust. Reply with JSON only: {"body": "the day\'s message, 70 to 110 words", "focus": "a two-to-four word theme", "question": "one reflective question", "whisper": "one or two sentences connecting today\'s Whisper card to their life, under 45 words, in the voice of an oracle: mysterious, powerful and mystical, as if the card was sent to them, yet always hopeful and uplifting"}.' },
        { role: 'user', content: [`Reader: ${clip(o.name, 40) || 'unnamed'}, Sun sign ${o.sign}`, o.natal ? `Birth chart: ${clip(o.natal, 500)}` : 'No birth chart', `Today (${o.day}): ${clip(o.sky, 300)}`, `Today's Whisper card: "${clip(card.title, 60)}": ${clip(card.msg, 300)} Keywords: ${clip((card.words || []).join(', '), 80)}`, portrait ? `What they have been writing about:\n${portrait}` : 'They have not written anything yet; welcome them warmly and invite them to reflect.'].join('\n') }
      ],
      response_format: { type: 'json_object' },
      user: user.id
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'Your day is still being written.');
  }
  let out = {};
  try { out = JSON.parse(body.choices?.[0]?.message?.content || '{}'); } catch {}
  if (!out.body) return fail(502, 'Your day is still being written.');
  const day = { body: clip(out.body, 1200), focus: clip(out.focus, 60), question: clip(out.question, 200), whisper: clip(out.whisper, 400), written: new Date().toISOString() };
  await store.setJSON(id, day).catch(() => {});
  return Response.json(day);
};

export const config = { path: '/api/daily', method: 'POST' };
