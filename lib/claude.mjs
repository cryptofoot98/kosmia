// Kosmia's writer. Every generated text (forecasts, the daily message, dreams, tarot readings, Kassandra) is written by
// Claude. OpenAI stays for images and voice only. If Claude cannot answer (no key, outage, timeout), the same request
// goes to OpenAI's text model so the reader is never left without words.
import Anthropic from '@anthropic-ai/sdk';

let client;
const claude = () => (client ||= new Anthropic({ apiKey: Netlify.env.get('ANTHROPIC_API_KEY'), timeout: 20000, maxRetries: 0 }));

// write({system, messages, schema?, effort?, user}) -> parsed JSON when a schema is given, otherwise text.
// messages: [{role: 'user'|'assistant', content: string}], starting with the user.
export async function write({ system, messages, schema, effort = 'low', user }) {
  if (Netlify.env.get('ANTHROPIC_API_KEY')) {
    try {
      const res = await claude().beta.messages.create({
        model: Netlify.env.get('ANTHROPIC_TEXT_MODEL') || 'claude-sonnet-5-5',
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system,
        messages,
        output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
        ...(user ? { metadata: { user_id: user } } : {})
      });
      if (res.stop_reason === 'refusal') throw new Error('refusal ' + (res.stop_details?.category || ''));
      const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      if (text) return schema ? JSON.parse(text) : text;
      throw new Error('empty reply, stop ' + res.stop_reason);
    } catch (e) {
      console.error('claude', e?.status || '', e?.message);
    }
  }
  return openai({ system, messages, json: !!schema, user });
}

async function openai({ system, messages, json, user }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Netlify.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: Netlify.env.get('OPENAI_TEXT_MODEL') || 'gpt-5.4-mini',
      messages: [{ role: 'system', content: system }, ...messages],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      user
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`openai ${res.status} ${body.error?.message || ''}`);
  const text = String(body.choices?.[0]?.message?.content || '').trim();
  return json ? JSON.parse(text || '{}') : text;
}

// JSON schema helpers for structured replies
export const str = { type: 'string' };
export const obj = props => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });
export const list = items => ({ type: 'array', items });
