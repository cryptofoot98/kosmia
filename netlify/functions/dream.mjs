// POST /api/dream {text, mood?, symbols?:[name], dictionary?:[id]} -> {title, keywords, meaning, symbols:[{name, meaning}], reflection, art}
// Kassandra reads a dream: its main symbol, possible themes and feelings, and a question to sit with. Dream meanings are
// offered as symbolic and subjective, never as predictions or diagnoses; only what the reader wrote is sent.
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in for Kassandra’s reading of your dream');
  const { text, mood, symbols = [], dictionary = [] } = await req.json().catch(() => ({}));
  const dream = clip(text, 1000);
  if (dream.length < 8) return fail(400, 'Describe your dream in a few more words first');

  if (!(await claim(user, 'dream', limit('DREAM_DAILY_LIMIT', 10)))) return fail(429, 'Kassandra has read enough dreams for today. Come back tomorrow.');

  const ids = dictionary.filter(x => /^[a-z]{2,12}$/.test(x)).slice(0, 60);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_TEXT_MODEL') || 'gpt-5.4-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You are Kassandra, the fortune teller of Kosmia, reading a dream in warm, poised British English. Treat dream symbols as personal and symbolic: say what they may suggest, never what will happen, and never diagnose. If the dream suggests distress or danger to the dreamer, gently suggest talking to someone they trust or a professional. Reply with JSON only, with these keys: "title" (the dream's main symbol as a short title, such as "The Owl" or "Falling"), "keywords" (three single words), "meaning" (two or three short paragraphs separated by \n, about 140 words in all, speaking to the dreamer as "you"), "symbols" (up to four other symbols in the dream, each {"name", "meaning"} where meaning is one or two words), "reflection" (one question for the dreamer to sit with), and "art" (the id from this list that best matches the main symbol, or ""): ${ids.join(', ')}. No markdown, no emoji.` },
        { role: 'user', content: `My dream: ${dream}${mood ? `\nHow I felt: ${clip(mood, 30)}` : ''}${symbols.length ? `\nSymbols I noticed: ${symbols.map(s => clip(s, 30)).slice(0, 8).join(', ')}` : ''}` }
      ],
      user: user.id
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'Kassandra could not read this dream just now, so the dream dictionary has.');
  }
  let r;
  try { r = JSON.parse(body.choices?.[0]?.message?.content || '{}'); } catch { r = {}; }
  const str = (v, n) => clip(v, n);
  return Response.json({
    title: str(r.title, 40) || 'Your Dream',
    keywords: (Array.isArray(r.keywords) ? r.keywords : []).map(k => str(k, 20)).filter(Boolean).slice(0, 3),
    meaning: String(r.meaning || '').split(/\n+/).map(p => str(p, 700)).filter(Boolean).slice(0, 4).join('\n'),
    symbols: (Array.isArray(r.symbols) ? r.symbols : []).map(s => ({ name: str(s && s.name, 30), meaning: str(s && s.meaning, 40) })).filter(s => s.name).slice(0, 4),
    reflection: str(r.reflection, 200),
    art: ids.includes(r.art) ? r.art : ''
  });
};

export const config = { path: '/api/dream', method: 'POST' };
