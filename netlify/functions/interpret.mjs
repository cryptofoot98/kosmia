// POST /api/interpret {spread, question?, focus?, cards:[{id, reversed}]}
//   -> {title, message, cards:[one reading per card], connect, embrace, mindful, guidance, reflection, whole}
// Writes a personal interpretation of a finished tarot reading with Claude, moving from the overall message to each card
// in its position and on to practical reflection. Cards are looked up on the server from public/tarot.js, so only ids and
// orientations are accepted from the client; the positions are the server's own. Tarot is a mirror for reflection: no
// certainties about the future, no claims about another person's intentions, no life-changing outcomes.
import '../../public/tarot.js';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import { write, obj, str, list } from '../../lib/claude.mjs';

const DECK = Object.fromEntries(globalThis.KOSMIA_TAROT.map(c => [c.id, c]));
const CELTIC = ['The present', 'The challenge', 'The foundation', 'The past', 'The crown', 'The near future', 'Yourself', 'Your surroundings', 'Hopes and fears', 'The outcome'];
const SPREADS = {
  daily: ['Daily Card', ['Your card for today']],
  ask: ['Ask the Tarot', ['Your situation', 'What to understand', 'Your guidance']],
  present: ['The Present Moment', ['What surrounds you', 'What needs attention', 'What may support you']],
  love: ['Love & Relationships', ['Your heart', 'The other heart', 'What connects you', 'What challenges you', 'What may help it grow']],
  career: ['Career & Purpose', ['Where you are', 'Your strengths', 'What holds you back', 'What to develop', 'Where it may lead']],
  crossroads: ['The Crossroads', ['The heart of the decision', 'One path', 'The other path', 'What you may be overlooking', 'What may guide your choice']],
  growth: ['Inner Growth', ['Where you stand', 'What is ready to grow', 'What to release', 'Your hidden strength', 'Your next step']],
  ppf: ['Past, Present & Future', ['Past', 'Present', 'Future']],
  celtic: ['The Celtic Cross', CELTIC],
  // readings made before the spreads were renewed
  one: ['Cosmic Guidance', ['Guidance']],
  scg: ['Situation, Challenge, Guidance', ['Situation', 'Challenge', 'Guidance']]
};
const FOCUS = { general: 'general guidance', love: 'love and relationships', career: 'career and purpose', growth: 'personal growth', wellbeing: 'wellbeing, emotional balance and self-care', decisions: 'decisions and change' };

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for a personal interpretation');
  const { spread, question, focus, cards } = await req.json().catch(() => ({}));
  const sp = SPREADS[spread];
  if (!sp || !Array.isArray(cards) || cards.length !== sp[1].length || !cards.every(c => DECK[c?.id])) return fail(400, 'Unknown reading');
  const q = String(question || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const f = FOCUS[focus] || '';

  if (!(await claim(user, 'interpret', limit('INTERPRET_DAILY_LIMIT', 10)))) return fail(429, 'You have had today’s readings. Come back tomorrow.');

  const lines = cards.map((c, i) => {
    const d = DECK[c.id], rev = !!c.reversed;
    return `${sp[1][i]}: ${d.name}${rev ? ' (reversed)' : ''}. Keywords: ${rev ? d.rev : d.up}. Meaning: ${rev ? d.revm : d.upm}`;
  }).join('\n');
  const daily = spread === 'daily' || spread === 'one', big = cards.length >= 10;
  let out = {};
  try {
    out = await write({
      user: user.id,
      effort: 'medium',
      schema: obj({ title: str, message: str, cards: list(str), connect: str, embrace: str, mindful: str, guidance: str, reflection: str }),
      system: `You are the gentle tarot reader of Kosmia, a vintage, contemplative astrology app. Write in British English, speaking to the reader as "you". Tarot is a mirror for reflection, not prediction: use "may", "perhaps" and "invites"; no certainties about the future, no claims about another person's thoughts or intentions, no life-changing outcomes, no medical, legal or financial advice, no emoji, no markdown. Reply with JSON only: "title" (a short, personal title for the reading, two to five words, such as "Finding Your Own Light"), "message" (the message of the reading as a whole, ${daily ? '50 to 70' : '70 to 110'} words${q ? ', answering the reader\'s question directly but gently' : ''}), "cards" (one string per card, in the order given, ${big ? '35 to 55' : '40 to 70'} words each, reading that card in its position${q ? ' and in light of the question' : ''}), "connect" (${daily ? '""' : 'how the cards connect: shared themes, suits, Major Arcana and how the positions build on one another, 50 to 90 words'}), "embrace" (${daily ? '""' : 'what to embrace: constructive qualities or opportunities, one or two sentences'}), "mindful" (${daily ? '""' : 'what to be mindful of: possible challenges, one or two sentences'}), "guidance" (${daily ? 'guidance for today' : 'practical guidance'}, two or three sentences), "reflection" (one question written in the first person).`,
      messages: [{ role: 'user', content: `Spread: ${sp[0]}${f ? `\nArea of focus: ${f}` : ''}\nQuestion: ${q || '(none: the reader is open to guidance)'}\nCards:\n${lines}` }]
    });
  } catch (e) {
    console.error(e.message);
    return fail(502, 'The cards are quiet right now. Try again in a moment.');
  }
  const s = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const per = Array.isArray(out.cards) ? out.cards.slice(0, cards.length).map(x => s(x, 700)) : [];
  const message = s(out.message, 1000);
  return Response.json({ title: s(out.title, 60), message, cards: per, connect: s(out.connect, 900), embrace: s(out.embrace, 500), mindful: s(out.mindful, 500), guidance: s(out.guidance, 600), reflection: s(out.reflection, 220), whole: message });
};

export const config = { path: '/api/interpret', method: 'POST' };
