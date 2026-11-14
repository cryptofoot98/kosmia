// POST /api/transcribe (body: the recorded audio, up to 4 MB) -> {text}
// Turns a spoken question for Kassandra into text with OpenAI. The audio is not stored.
import { authUser, claim, fail, limit } from '../../lib/supa.mjs';

const MAX = 4 * 1024 * 1024;

export default async req => {
  const user = await authUser(req);
  if (!user) return fail(401, 'Sign in to speak with Kassandra');
  const type = (req.headers.get('content-type') || '').split(';')[0];
  if (!/^audio\//.test(type)) return fail(400, 'Expected audio');
  const audio = await req.arrayBuffer();
  if (!audio.byteLength || audio.byteLength > MAX) return fail(400, 'That recording is too long. Keep it under a minute.');

  if (!(await claim(user, 'transcribe', limit('TRANSCRIBE_DAILY_LIMIT', 40)))) return fail(429, 'Voice is resting until tomorrow. You can still type.');

  const ext = { 'audio/webm': 'webm', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a' }[type] || 'webm';
  const fd = new FormData();
  fd.append('model', Netlify.env.get('OPENAI_TRANSCRIBE_MODEL') || 'gpt-4o-mini-transcribe');
  fd.append('file', new Blob([audio], { type }), `question.${ext}`);
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: fd
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('openai', res.status, body.error?.message);
    return fail(502, 'Kassandra could not hear that. Try again, or type your question.');
  }
  return Response.json({ text: String(body.text || '').trim() });
};

export const config = { path: '/api/transcribe', method: 'POST' };
