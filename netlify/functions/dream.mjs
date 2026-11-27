// POST /api/dream {text, mood?, symbols?:[name], dictionary?:[id]} -> {title, keywords, symbols:[{name, keys, meaning, id}], beneath, reflection, art}
// Kassandra reads a dream: its main symbol, possible themes and feelings, and a question to sit with. Dream meanings are
// offered as symbolic and subjective, never as predictions or diagnoses; only what the reader wrote is sent.
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';
import { write, obj, str, list } from '../../lib/claude.mjs';

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for Kassandra’s reading of your dream');
  const { text, mood, symbols = [], dictionary = [] } = await req.json().catch(() => ({}));
  const dream = clip(text, 1000);
  if (dream.length < 8) return fail(400, 'Describe your dream in a few more words first');

  if (!(await claim(user, 'dream', limit('DREAM_DAILY_LIMIT', 10)))) return fail(429, 'Kassandra has read enough dreams for today. Come back tomorrow.');

  const ids = dictionary.filter(x => /^[a-z]{2,12}$/.test(x)).slice(0, 60);
  let r = {};
  try {
    r = await write({
      user: user.id,
      effort: 'medium',
      schema: obj({ title: str, keywords: list(str), symbols: list(obj({ name: str, keys: list(str), meaning: str, id: str })), beneath: str, reflection: str, art: str }),
      system: `You are Kassandra, the dream reader of Kosmia, reading a dream in warm, poised British English, speaking to the dreamer as "you". Dreams are personal: offer every meaning as a possible emotional association ("may", "perhaps", "you might"), take the dreamer's own feelings into account, and never predict, diagnose or claim certainty. If the dream suggests distress or danger to the dreamer, gently suggest talking to someone they trust or a professional. Reply with JSON only, with these keys: "title" (a short, poetic, personal title for the dream, two to four words, such as "Beyond the Shore"), "keywords" (three single words for its themes, such as Transition, Freedom, Possibility), "symbols" (the two to four main symbols in the dream, most important first, each {"name" (such as "The Ocean" or "The Open Door"), "keys" (two or three single words), "meaning" (one or two sentences on what it may reflect for the dreamer), "id" (the id from this list that best matches it, or "")}), "beneath" (about 70 words on what the symbols together may suggest about the dreamer's emotional life now, gentle and personal), "reflection" (one question written in the first person, such as "What new possibility am I drawn towards, and what feelings might be holding me back?"), and "art" (the id of the main symbol from the list, or ""). The ids: ${ids.join(', ')}. No markdown, no emoji.`,
      messages: [{ role: 'user', content: `My dream: ${dream}${mood ? `
How I felt when I woke: ${clip(mood, 30)}` : ''}${symbols.length ? `
Symbols I noticed: ${symbols.map(s => clip(s, 30)).slice(0, 8).join(', ')}` : ''}` }]
    });
  } catch (e) {
    console.error(e.message);
    return fail(502, 'Kassandra could not read this dream just now, so the dream dictionary has.');
  }
  const syms = (Array.isArray(r.symbols) ? r.symbols : []).map(s => ({ name: clip(s && s.name, 30), keys: (Array.isArray(s && s.keys) ? s.keys : []).map(k => clip(k, 20)).filter(Boolean).slice(0, 3), meaning: clip(s && s.meaning, 300), id: ids.includes(s && s.id) ? s.id : '' })).filter(s => s.name).slice(0, 4);
  const beneath = clip(r.beneath, 900);
  return Response.json({
    title: clip(r.title, 40) || 'Your Dream',
    keywords: (Array.isArray(r.keywords) ? r.keywords : []).map(k => clip(k, 20)).filter(Boolean).slice(0, 3),
    symbols: syms,
    beneath,
    meaning: beneath,
    reflection: clip(r.reflection, 200),
    art: ids.includes(r.art) ? r.art : (syms[0] && syms[0].id) || ''
  });
};

export const config = { path: '/api/dream', method: 'POST' };
