// Supabase helpers for Netlify functions. Every call is made with the caller's
// own access token, so row-level security applies exactly as in the browser.

const base = () => Netlify.env.get('SUPABASE_URL');
const headers = token => ({ apikey: Netlify.env.get('SUPABASE_ANON_KEY'), authorization: `Bearer ${token}` });

export const fail = (status, error) => Response.json({ error }, { status });

// Resolves the signed-in user from the request's bearer token, or null.
export async function authUser(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || !base()) return null;
  const res = await fetch(`${base()}/auth/v1/user`, { headers: headers(token) });
  if (!res.ok) return null;
  return { ...(await res.json()), token };
}

// Takes one use of `kind` from today's allowance; false when it is used up.
export async function claim(user, kind, limit) {
  const res = await fetch(`${base()}/rest/v1/rpc/claim_ai_quota`, {
    method: 'POST',
    headers: { ...headers(user.token), 'content-type': 'application/json' },
    body: JSON.stringify({ p_kind: kind, p_limit: limit })
  });
  if (!res.ok) throw new Error(`quota check failed: HTTP ${res.status}`);
  return (await res.json()) === true;
}

export async function upload(user, bucket, path, bytes, type) {
  const res = await fetch(`${base()}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { ...headers(user.token), 'content-type': type, 'x-upsert': 'true' },
    body: bytes
  });
  if (!res.ok) throw new Error(`upload failed: HTTP ${res.status} ${await res.text()}`);
}

export const limit = (name, fallback) => Number(Netlify.env.get(name)) || fallback;
