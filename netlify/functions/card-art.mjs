// /api/card-art — the daily card's artwork, painted once per (day, card) and shared by everyone.
//   GET  ?day=YYYY-MM-DD&card=<oracle id>  -> image/webp, or 404 while it does not exist yet
//   POST {day, card} (signed in)           -> {ready:true} once stored, or {pending:true} while another
//                                             request is already painting it (poll again)
// Images live in the site-wide Netlify Blobs store "card-art" under "<day>/<card>.webp".
import { getStore } from '@netlify/blobs';
import { ORACLE, dailyCardPrompt } from '../../lib/art.mjs';
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const LOCK_MS = 120_000;
const store = () => getStore('card-art');
const valid = (day, card) => DAY.test(day || '') && Object.hasOwn(ORACLE, card || '');

// Local dates run up to a day either side of UTC; anything further away is not "today" for anyone.
const nearToday = day => Math.abs(Date.parse(day + 'T12:00:00Z') - Date.now()) < 36 * 3600_000;

export default async req => {
  if (req.method === 'GET') {
    const u = new URL(req.url), day = u.searchParams.get('day'), card = u.searchParams.get('card');
    if (!valid(day, card)) return fail(400, 'Unknown day or card');
    const img = await store().get(`${day}/${card}.webp`, { type: 'arrayBuffer' });
    if (!img) return new Response('Not painted yet', { status: 404, headers: { 'cache-control': 'no-store' } });
    return new Response(img, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in to receive today’s card');
  const { day, card } = await req.json().catch(() => ({}));
  if (!valid(day, card) || !nearToday(day)) return fail(400, 'Unknown day or card');

  const blobs = store(), key = `${day}/${card}.webp`, lock = `${day}/${card}.lock`;
  if (await blobs.getMetadata(key)) return Response.json({ ready: true });

  // One painter per card per day: take the lock, or report that someone else holds it.
  const { modified } = await blobs.set(lock, String(Date.now()), { onlyIfNew: true });
  if (!modified) {
    const since = Number(await blobs.get(lock)) || 0;
    if (Date.now() - since < LOCK_MS) return Response.json({ pending: true });
    await blobs.set(lock, String(Date.now()));  // the previous painter gave up; take over
  }

  try {
    if (!(await claim(user, 'cardart', limit('CARD_ART_DAILY_LIMIT', 4)))) return fail(429, 'The cosmos needs a rest. Try again tomorrow.');
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
      body: JSON.stringify({
        model: Netlify.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-2',
        prompt: dailyCardPrompt(card, day), size: '1024x1536', quality: 'medium', output_format: 'webp', output_compression: 82, n: 1,
        user: user.id
      })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('openai', res.status, body.error?.message);
      return fail(502, 'The cosmos is quiet right now. Try again in a moment.');
    }
    await blobs.set(key, new Blob([Buffer.from(body.data[0].b64_json, 'base64')], { type: 'image/webp' }), { metadata: { card, day } });
    return Response.json({ ready: true });
  } finally {
    await blobs.delete(lock);
  }
};

export const config = { path: '/api/card-art', method: ['GET', 'POST'] };
