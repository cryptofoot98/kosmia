// POST /api/kassandra {messages:[{role,content}], context:{section, view, reading?, personal?}} -> {reply}
// Kassandra, Kosmia's fortune teller. The sky for this week is calculated here (public/sky.js), so what she says about
// real celestial events is never guessed. Personal details only arrive when the reader has switched that on.
import { createRequire } from 'node:module';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import '../../public/sky.js'; // reads globalThis.Astronomy only when called
// astronomy-engine's ESM build is not marked as a module, so load its CommonJS build
globalThis.Astronomy = createRequire(import.meta.url)('astronomy-engine');
const K = globalThis.KosmiaSky;

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in to talk with Kassandra');
  const { messages, context = {} } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || !messages.length) return fail(400, 'Say something to Kassandra first');
  const chat = messages.slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clip(m.content, 1200) })).filter(m => m.content);
  if (chat.at(-1)?.role !== 'user') return fail(400, 'Say something to Kassandra first');

  if (!(await claim(user, 'kassandra', limit('KASSANDRA_DAILY_LIMIT', 40)))) return fail(429, 'Kassandra is resting until tomorrow. Come back then.');

  const today = new Date().toISOString().slice(0, 10), week = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const facts = [
    `Today (UTC) is ${today}. The sky from today to ${week}, calculated from an ephemeris (geocentric, tropical zodiac):`,
    K.summary(today, week)
  ].join('\n');
  const ctx = [
    `The reader is on: ${clip(context.section, 40)}${context.view ? ' / ' + clip(context.view, 40) : ''}.`,
    context.reading ? `What is on their screen: ${clip(context.reading, 1500)}` : '',
    context.personal ? `Details the reader chose to share: ${clip(context.personal, 800)}` : 'The reader has not shared personal details. If a question needs their birth chart or numbers, say what you would need and that they can share it from the Kassandra panel or add it in Blueprint. Never guess them.'
  ].filter(Boolean).join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_TEXT_MODEL') || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: `You are Kassandra, the fortune teller of Kosmia, a vintage, contemplative astrology app whose line is "What if the cosmos is listening?". Speak in warm, poised British English, a little mysterious but always clear, in short paragraphs (usually under 150 words). You can explain tarot cards and spreads, the daily Whisper cards, zodiac signs and symbolic compatibility, numerology (Pythagorean), birth chart placements, and real celestial events. Treat astrology, tarot and numerology as symbolic languages for reflection: never claim to predict outcomes with certainty, never give medical, legal, financial or crisis advice (gently point to a qualified person or local emergency services when someone may be at risk). Only state astronomical facts that appear in the sky facts below; if asked about something not listed, say you would need to check rather than invent dates or positions. Never invent the reader's birth details, chart placements, saved readings or memories of past conversations. Write dates in words (26 October, not 2026-10-26). No emoji, no markdown headings.\n\n${facts}\n\n${ctx}` },
        ...chat
      ],
      user: user.id
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'The crystal is clouded. Try again in a moment.');
  }
  return Response.json({ reply: String(body.choices?.[0]?.message?.content || '').trim() });
};

export const config = { path: '/api/kassandra', method: 'POST' };
