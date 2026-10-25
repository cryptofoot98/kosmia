// POST /api/paint {day, cardId, sign} -> {path, image}
// Paints a personal version of the user's daily oracle card with OpenAI, stores
// it at paintings/<user id>/<day>.webp and returns it as a data URL.
import { paintPrompt } from '../../lib/art.mjs';
import { authUser, claim, upload, fail, limit } from '../../lib/supa.mjs';

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in to paint your card');

  const { day, cardId, sign } = await req.json().catch(() => ({}));
  const prompt = paintPrompt(cardId, sign);
  if (!prompt || !/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return fail(400, 'Unknown card, sign or day');

  if (!(await claim(user, 'paint', limit('PAINT_DAILY_LIMIT', 3)))) return fail(429, 'You have used today’s paintings. Come back tomorrow.');

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-2',
      prompt, size: '1024x1536', quality: 'medium', output_format: 'webp', output_compression: 80, n: 1,
      user: user.id
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'The painter is resting. Try again in a moment.');
  }

  const b64 = body.data[0].b64_json, path = `${user.id}/${day}.webp`;
  await upload(user, 'paintings', path, Buffer.from(b64, 'base64'), 'image/webp');
  return Response.json({ path, image: `data:image/webp;base64,${b64}` });
};

export const config = { path: '/api/paint', method: 'POST' };
