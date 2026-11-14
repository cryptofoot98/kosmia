// POST /api/interpret {spread, question, cards:[{id, reversed}]} -> {cards:[one reading per card], whole}
// Writes a personal interpretation of a finished tarot reading with OpenAI. Cards are looked up on the
// server from public/tarot.js, so only ids and orientations are accepted from the client.
import '../../public/tarot.js';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';

const DECK = Object.fromEntries(globalThis.KOSMIA_TAROT.map(c => [c.id, c]));
const SPREADS = {
  one: ['Cosmic Guidance', ['Guidance']],
  ppf: ['Past, Present, Future', ['Past', 'Present', 'Future']],
  scg: ['Situation, Challenge, Guidance', ['Situation', 'Challenge', 'Guidance']],
  love: ['Love Reading', ['You', 'Them', 'The connection', 'The challenge', 'The direction']],
  career: ['Career Reading', ['Where you are', 'Your strengths', 'The obstacle', 'Action to take', 'Where it tends']],
  celtic: ['Celtic Cross', ['The present', 'The challenge', 'The foundation', 'The past', 'The crown', 'The near future', 'Yourself', 'Your surroundings', 'Hopes and fears', 'The outcome']]
};

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for a personal interpretation');
  const { spread, question, cards } = await req.json().catch(() => ({}));
  const sp = SPREADS[spread];
  if (!sp || !Array.isArray(cards) || cards.length !== sp[1].length || !cards.every(c => DECK[c?.id])) return fail(400, 'Unknown reading');
  const q = String(question || '').replace(/\s+/g, ' ').trim().slice(0, 300);

  if (!(await claim(user, 'interpret', limit('INTERPRET_DAILY_LIMIT', 10)))) return fail(429, 'You have had today’s readings. Come back tomorrow.');

  const lines = cards.map((c, i) => {
    const d = DECK[c.id], rev = !!c.reversed;
    return `${sp[1][i]}: ${d.name}${rev ? ' (reversed)' : ''}. Keywords: ${rev ? d.rev : d.up}. Meaning: ${rev ? d.revm : d.upm}`;
  }).join('\n');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_TEXT_MODEL') || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: 'You are the gentle tarot reader of Kosmia, a vintage, contemplative astrology app. Write in British English, speaking to the reader as "you". Treat tarot as a mirror for reflection, not prediction: no certainties about the future, no medical, legal or financial advice, no emoji. Reply with JSON only: {"cards": [one string per card, in the order given, 40 to 70 words each, reading that card in its position and in light of the question], "whole": "the reading as a whole, 110 to 170 words in two short paragraphs: how the cards connect and build on one another, what they suggest together about the question, closing with one reflective invitation"}.' },
        { role: 'user', content: `Spread: ${sp[0]}\nQuestion: ${q || '(none, a general reading)'}\nCards:\n${lines}` }
      ],
      response_format: { type: 'json_object' },
      user: user.id
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'The cards are quiet right now. Try again in a moment.');
  }
  let out = {};
  try { out = JSON.parse(body.choices?.[0]?.message?.content || '{}'); } catch {}
  const per = Array.isArray(out.cards) ? out.cards.slice(0, cards.length).map(x => String(x || '').trim()) : [];
  return Response.json({ cards: per, whole: String(out.whole || '').trim() });
};

export const config = { path: '/api/interpret', method: 'POST' };
