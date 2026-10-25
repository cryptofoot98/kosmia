// POST /api/speak {text} -> audio/mpeg
// Reads a horoscope or oracle message aloud with ElevenLabs.
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';

const MAX_CHARS = 1500;

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in to listen');

  const { text } = await req.json().catch(() => ({}));
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length > MAX_CHARS) return fail(400, `Text must be 1–${MAX_CHARS} characters`);

  if (!(await claim(user, 'speak', limit('SPEAK_DAILY_LIMIT', 30)))) return fail(429, 'You have used today’s listening. Come back tomorrow.');

  const voice = Netlify.env.get('ELEVENLABS_VOICE_ID') || 'EXAVITQu4vr4xnSDxMaL'; // Sarah
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'audio/mpeg', 'xi-api-key': Netlify.env.get('ELEVENLABS_API_KEY') },
    body: JSON.stringify({ text: clean, model_id: Netlify.env.get('ELEVENLABS_MODEL_ID') || 'eleven_multilingual_v2' })
  });
  if (!res.ok) {
    console.error('elevenlabs', res.status, await res.text());
    return fail(502, 'The voice is resting. Try again in a moment.');
  }
  return new Response(res.body, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=86400' } });
};

export const config = { path: '/api/speak', method: 'POST' };
