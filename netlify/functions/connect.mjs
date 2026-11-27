// POST /api/connect
//  {kind:'insight', rel, q?, a:{name, sun, moon?, mercury?, venus?, mars?}, b:{...}}
//    -> {essence, together, emotional, communication, support, tension, boundaries, growth, answer, nurture, reflection}
//  {kind:'chart', rel, a:{name, sun, moon?}, b:{...}, aspects:[text], houses:[text], limited}
//    -> {essence, groups:{sun, moon, mercury, venus, mars, jupiter, saturn, outer}, story, nurture, reflection}
// Kassandra reads the bond between two people from their signs or their calculated birth charts (the positions and
// aspects are computed in the app from real birth details; only names, signs and aspects are sent). Astrology is offered
// as a symbolic framework for reflection: no percentages, no verdicts on whether a relationship should continue, and
// never a claim to know another person's private thoughts, feelings or intentions.
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import { write, obj, str } from '../../lib/claude.mjs';

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const RELS = { romantic: 'a romantic relationship', friendship: 'a friendship', family: 'a family relationship', professional: 'a professional relationship', other: 'a meaningful relationship' };
const FOCUS = {
  romantic: 'emotional intimacy, affection, attraction, commitment and growing together',
  friendship: 'emotional support, trust and loyalty, shared interests, friendship boundaries and strengthening the friendship',
  family: 'family bonds, shared values, expectations, family roles and mutual understanding',
  professional: 'collaboration, working styles, communication, professional boundaries and shared goals',
  other: 'understanding, respect, communication and how the two people may support each other'
};
const VOICE = 'You are Kassandra, the gentle guide of Kosmia, a contemplative astrology app. Write in warm, poised British English. Astrology is a symbolic framework for reflection, not a validated assessment of compatibility: use "may", "often" and "perhaps"; never give percentages, scores, predictions or a judgement about whether the relationship should continue; never claim to know the other person\'s private thoughts, feelings or intentions; keep every suggestion kind and constructive. If the question suggests harm, abuse or danger, gently suggest talking to someone they trust or a professional. No markdown, no emoji.';
const who = p => {
  const o = p && typeof p === 'object' ? p : {};
  const parts = ['sun', 'moon', 'mercury', 'venus', 'mars'].filter(k => o[k]).map(k => `${k[0].toUpperCase() + k.slice(1)} in ${clip(o[k], 14)}`);
  return `${clip(o.name, 40) || 'Someone'}: ${parts.join(', ') || 'sign unknown'}`;
};

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for Kassandra’s personal reading');
  const b = await req.json().catch(() => ({}));
  const kind = b.kind === 'chart' ? 'chart' : b.kind === 'insight' ? 'insight' : '';
  if (!kind) return fail(400, 'Unknown reading');
  const rel = RELS[b.rel] ? b.rel : 'other';
  if (!(await claim(user, 'connect', limit('CONNECT_DAILY_LIMIT', 10)))) return fail(429, 'Kassandra has read enough connections for today. Come back tomorrow.');
  const nameA = clip(b.a && b.a.name, 40) || 'the first person', nameB = clip(b.b && b.b.name, 40) || 'the second person';
  let r;
  try {
    if (kind === 'insight') {
      r = await write({
        user: user.id, effort: 'medium',
        schema: obj({ essence: str, together: str, emotional: str, communication: str, support: str, tension: str, boundaries: str, growth: str, answer: str, nurture: str, reflection: str }),
        system: `${VOICE} Read ${RELS[rel]} between ${nameA} and ${nameB}, focusing on ${FOCUS[rel]}. Speak about "the two of you" when the reader is one of them, otherwise about the two people by name. Reply with JSON only, each value two or three sentences: "essence" (the essence of the bond), "together" (what brings them together), "emotional" (emotional dynamics: possible needs and differences), "communication", "support" (how they may support each other), "tension" (areas of tension and possible misunderstandings), "boundaries" (boundaries and expectations needing mutual awareness), "growth" (growth together), "answer" (a gentle reflection on the reader's own question, or "" if there is none), "nurture" (two or three practical, constructive suggestions in one short paragraph), "reflection" (one question written in the first person).`,
        messages: [{ role: 'user', content: `${b.me ? `I am ${nameA}.\n` : ''}${who(b.a)}\n${who(b.b)}\nRelationship: ${RELS[rel]}${b.q ? `\nWhat I would like to understand: ${clip(b.q, 300)}` : ''}` }]
      });
    } else {
      const asp = (Array.isArray(b.aspects) ? b.aspects : []).map(x => clip(x, 90)).slice(0, 24), hs = (Array.isArray(b.houses) ? b.houses : []).map(x => clip(x, 90)).slice(0, 10);
      r = await write({
        user: user.id, effort: 'medium',
        schema: obj({ essence: str, groups: obj({ sun: str, moon: str, mercury: str, venus: str, mars: str, jupiter: str, saturn: str, outer: str }), story: str, nurture: str, reflection: str }),
        system: `${VOICE} Interpret the synastry (the comparison of two birth charts) of ${RELS[rel]} between ${nameA} and ${nameB}, focusing on ${FOCUS[rel]}. Use only the aspects and house placements given; they were calculated from real birth details. ${b.limited ? 'Some birth times are unknown, so houses and the Ascendant are left out and the Moon may be uncertain: do not mention them as facts. ' : ''}Reply with JSON only: "essence" (about 70 words on the overall connection), "groups" (for each of sun, moon, mercury, venus, mars, jupiter, saturn and outer (Uranus, Neptune, Pluto), two sentences on what the listed aspects involving that planet may mean for this relationship, or "" when none are listed), "story" (about 80 words, "the story of your two skies", weaving the main themes together), "nurture" (two or three practical suggestions in one short paragraph), "reflection" (one question written in the first person).`,
        messages: [{ role: 'user', content: `${who(b.a)}\n${who(b.b)}\nRelationship: ${RELS[rel]}\nAspects between the charts:\n${asp.join('\n') || 'none within orb'}${hs.length ? `\nHouse placements:\n${hs.join('\n')}` : ''}` }]
      });
    }
  } catch (e) {
    console.error(e.message);
    return fail(502, 'Kassandra could not read this just now, so Kosmia’s own book has.');
  }
  const out = {};
  for (const [k, v] of Object.entries(r || {})) out[k] = typeof v === 'string' ? clip(v, 900) : Object.fromEntries(Object.entries(v || {}).map(([g, t]) => [g, clip(t, 500)]));
  return Response.json(out);
};

export const config = { path: '/api/connect', method: 'POST' };
