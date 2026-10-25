# Kosmia

*The Universe Is With You.* A phone-first astrology companion: daily horoscopes,
a daily oracle card, tarot spreads, love match, a computed birth chart and a
cosmic calendar (moon phases, equinoxes, solstices, eclipses).

It's a static site with no build step. Supabase handles accounts and sync, and Netlify hosts it.

```
public/
  index.html     page shell
  styles.css     design tokens + components
  app.js         views, astronomy, tarot, horoscope logic
  cloud.js       Supabase auth (email magic link) + sync
  config.js      generated at build time (gitignored)
scripts/build-config.sh   writes public/config.js from env vars
supabase/migrations/      database schema + row-level security
netlify.toml              publish dir, SPA fallback, headers
```

## How sync works

- Without Supabase keys the app runs **local-only** (localStorage), same as the prototype.
- With keys, joining also emails a **magic link**. Opening it signs the user in, and
  their local data merges with their account: profile, revealed and saved cards,
  reflections, saved matches and tarot readings.
- After that, every change is written to Supabase and cached locally.
- Every table has row-level security, so users can read and write only their own rows.

## Supabase setup

1. Apply the schema in `supabase/migrations/` (either `supabase db push` or paste it into the SQL editor).
2. **Authentication → URL Configuration**: set the Site URL to your Netlify URL and add
   `http://localhost:8888/**` and `https://*--<your-site>.netlify.app/**` to the redirect URLs.
3. Copy the project URL and the anon/publishable key.

## Netlify setup

1. Import this repo as a new site. `netlify.toml` already sets publish = `public`.
2. Set environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` (see `.env.example`).
3. Deploy.

## AI features

OpenAI and ElevenLabs keys stay on the server. Never put them in `config.js`.

- **Crafted art**: run `node scripts/craft-images.mjs` locally. It reads `OPENAI_API_KEY` from `.env`
  and writes square art for the 12 oracle cards, 22 major arcana and 12 signs into `public/art/`,
  plus `public/art/index.js` listing what exists. Commit the results. Cards fall back to the SVG
  symbols for anything missing. Use `--only oracle|tarot|signs`, `--force` and `--quality`.
- **Paint my card** (`netlify/functions/paint.mjs`, `POST /api/paint`): a signed-in user gets a
  personal painting of today's oracle card for their sign. Prompts are built on the server from card and sign
  ids, so users cannot send free-form prompts. Images go to the private `paintings` Storage bucket.
- **Listen** (`netlify/functions/speak.mjs`, `POST /api/speak`): ElevenLabs reads a horoscope or
  oracle message aloud.
- Both endpoints check the user's Supabase token and claim from a per-user daily quota
  (`claim_ai_quota`, defaults of 3 paintings and 30 readings). Set `PAINT_DAILY_LIMIT` / `SPEAK_DAILY_LIMIT` to change it.

On Netlify, set `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` as **secret** variables scoped to Functions.
`SUPABASE_URL` and `SUPABASE_ANON_KEY` must be scoped to both Builds and Functions. See `.env.example`
for optional overrides (model, voice, limits).

## Local development

```sh
SUPABASE_URL=... SUPABASE_ANON_KEY=... sh scripts/build-config.sh
python3 -m http.server 8888 -d public     # or: netlify dev
```

Horoscope and tarot text is sample copy assembled in the browser. Astronomy comes
from [astronomy-engine](https://github.com/cosinekitty/astronomy).
