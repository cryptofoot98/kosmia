// Scheduled once a day: a tiny read from the database so the free Supabase project never counts as inactive and pauses
// (it pauses after a week without activity). Uses only the public anon key; row-level security returns no rows, but
// the query still reaches Postgres, which is what counts.
export default async () => {
  const url = Netlify.env.get('SUPABASE_URL'), key = Netlify.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return console.error('keepalive: SUPABASE_URL or SUPABASE_ANON_KEY missing');
  const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  console.log('keepalive', res.status);
};

export const config = { schedule: '17 4 * * *' }; // every day at 04:17 UTC
