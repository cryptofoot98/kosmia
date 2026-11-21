// POST /api/interpret {spread, question, cards:[{id, reversed}]} -> {cards:[one reading per card], whole}
// Writes a personal interpretation of a finished tarot reading with Claude. Cards are looked up on the
// server from public/tarot.js, so only ids and orientations are accepted from the client.
import '../../public/tarot.js';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import { write, obj, str, list } from '../../lib/claude.mjs';

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
  let out = {};
  try {
    out = await write({
      user: user.id,
      effort: 'medium',
      schema: obj({ cards: list(str), whole: str }),
      system: 'You are the gentle tarot reader of Kosmia, a vintage, contemplative astrology app. Write in British English, speaking to the reader as "you". Treat tarot as a mirror for reflection, not prediction: no certainties about the future, no medical, legal or financial advice, no emoji. Reply with JSON only: {"cards": [one string per card, in the order given, 40 to 70 words each, reading that card in its position and in light of the question], "whole": "the reading as a whole, 110 to 170 words in two short paragraphs: how the cards connect and build on one another, what they suggest together about the question, closing with one reflective invitation"}.',
      messages: [{ role: 'user', content: `Spread: ${sp[0]}\nQuestion: ${q || '(none, a general reading)'}\nCards:\n${lines}` }]
    });
  } catch (e) {
    console.error(e.message);
    return fail(502, 'The cards are quiet right now. Try again in a moment.');
  }
  const per = Array.isArray(out.cards) ? out.cards.slice(0, cards.length).map(x => String(x || '').trim()) : [];
  return Response.json({ cards: per, whole: String(out.whole || '').trim() });
};

export const config = { path: '/api/interpret', method: 'POST' };
