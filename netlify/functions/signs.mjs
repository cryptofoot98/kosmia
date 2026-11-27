// POST /api/signs
//  {kind:'number', number, context?, themes:[id]} -> {title, symbolism, meaning, reflection, themes:[id]}
//  {kind:'sync', text, feel?, themes:[id]}       -> {title, moment, symbolism, deeper, reflection, action, themes:[id]}
// Kassandra reads a repeating number or a meaningful coincidence. Signs are offered as invitations to reflect, never as
// predictions, supernatural messages or certainties; only what the reader wrote is sent. `themes` is the list of theme ids
// Kosmia tracks in Patterns, so the reading can name the threads it touches.
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import { write, obj, str, list } from '../../lib/claude.mjs';

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const VOICE = 'You are Kassandra, the gentle guide of Kosmia, a contemplative astrology app. Write in warm, poised British English, speaking to the reader as "you". Treat signs, numbers and coincidences as invitations to reflect, never as predictions, supernatural messages or certainties: use words such as "may", "often" and "you might". Never create fear or dependence on signs, never give medical, legal or financial advice, and if what the reader shares suggests distress or danger, gently suggest talking to someone they trust or a professional. No markdown, no emoji.';

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for Kassandra’s personal reading');
  const b = await req.json().catch(() => ({}));
  const ids = (Array.isArray(b.themes) ? b.themes : []).filter(x => /^[a-z]{2,16}$/.test(x)).slice(0, 40);
  const pick = t => (Array.isArray(t) ? t : []).filter(x => ids.includes(x)).slice(0, 3);
  const kind = b.kind === 'sync' ? 'sync' : b.kind === 'number' ? 'number' : '';
  const number = clip(b.number, 12).replace(/[^0-9]/g, '');
  const text = clip(b.text, 1200), context = clip(b.context, 400), feel = clip(b.feel, 30);
  if (kind === 'number' && !number) return fail(400, 'Enter the number you noticed');
  if (kind === 'sync' && text.length < 8) return fail(400, 'Tell a little more about what happened first');
  if (!kind) return fail(400, 'Unknown reading');

  if (!(await claim(user, 'signs', limit('SIGNS_DAILY_LIMIT', 12)))) return fail(429, 'Kassandra has read enough signs for today. Come back tomorrow.');

  let r = {};
  try {
    r = kind === 'number' ? await write({
      user: user.id,
      effort: 'low',
      schema: obj({ title: str, symbolism: str, meaning: str, reflection: str, themes: list(str) }),
      system: `${VOICE} Read a number the reader keeps seeing, drawing on Pythagorean numerology (each digit's traditional meaning, repetition as emphasis, and the number's reduced root, keeping 11, 22 and 33). Reply with JSON only, with these keys: "title" (a short evocative title, such as "The Beginning of Something New"), "symbolism" (two or three sentences on what this number is often associated with in numerology), "meaning" (two or three sentences on what it may mean for the reader now, gently using what they say was happening if they said anything), "reflection" (one question written in the first person, such as "What would I begin today if I trusted myself a little more?"), "themes" (one to three ids from this list that the reading touches: ${ids.join(', ')}).`,
      messages: [{ role: 'user', content: `The number I keep noticing: ${number}${context ? `\nWhat was happening when I noticed it: ${context}` : ''}` }]
    }) : await write({
      user: user.id,
      effort: 'medium',
      schema: obj({ title: str, moment: str, symbolism: str, deeper: str, reflection: str, action: str, themes: list(str) }),
      system: `${VOICE} Read a meaningful coincidence or experience the reader shares. Reply with JSON only, with these keys: "title" (a short evocative title for the experience, such as "The Feather on the Threshold"), "moment" (one or two sentences summarising what they experienced, in the second person), "symbolism" (two or three sentences on the possible symbolic associations of what appeared), "deeper" (a personal interpretation of about 80 words connected to their feelings and circumstances), "reflection" (one question written in the first person), "action" (one optional, small, practical action inspired by the reading, one sentence), "themes" (one to three ids from this list that the reading touches: ${ids.join(', ')}).`,
      messages: [{ role: 'user', content: `What happened: ${text}${feel ? `\nHow it made me feel: ${feel}` : ''}` }]
    });
  } catch (e) {
    console.error(e.message);
    return fail(502, 'Kassandra could not read this just now, so Kosmia’s own book of signs has.');
  }
  const out = { title: clip(r.title, 60), symbolism: clip(r.symbolism, 700), reflection: clip(r.reflection, 220), themes: pick(r.themes) };
  if (kind === 'number') out.meaning = clip(r.meaning, 700);
  else Object.assign(out, { moment: clip(r.moment, 400), deeper: clip(r.deeper, 900), action: clip(r.action, 260) });
  return Response.json(out);
};

export const config = { path: '/api/signs', method: 'POST' };
