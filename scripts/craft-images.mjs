#!/usr/bin/env node
// Generates Kosmia's crafted art with OpenAI and writes it into public/art/:
//   oracle/<id>.webp, tarot/m<n>.webp, signs/<id>.webp, scenes/<sign>.webp, plus index.js telling
//   the app which images exist. Runs locally; the key never leaves this machine.
//
//   node scripts/craft-images.mjs                  # make whatever is missing
//   node scripts/craft-images.mjs --only oracle    # one folder (oracle|tarot|signs|scenes|cards|whispers)
//   node scripts/craft-images.mjs --ids leo,virgo  # only these ids
//   node scripts/craft-images.mjs --force          # regenerate even if present
//   node scripts/craft-images.mjs --quality medium # cheaper drafts (default high)
//
// Reads OPENAI_API_KEY (and optional OPENAI_IMAGE_MODEL) from the environment or .env.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { craftList } from '../lib/art.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'art');

try {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}

const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const only = arg('--only'), ids = arg('--ids')?.split(','), force = process.argv.includes('--force'), quality = arg('--quality') || 'high';
const key = process.env.OPENAI_API_KEY, model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
if (!key) { console.error('craft-images: OPENAI_API_KEY is not set (add it to .env)'); process.exit(1); }

async function generate(prompt, size) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, prompt, size, quality, output_format: 'webp', output_compression: 85, n: 1 })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
  return Buffer.from(body.data[0].b64_json, 'base64');
}

const jobs = craftList().filter(([dir, id]) => (!only || dir === only) && (!ids || ids.includes(id)) && (force || !existsSync(join(out, dir, id + '.webp'))));
console.log(`craft-images: ${jobs.length} image(s) to make with ${model} at ${quality} quality`);

let failed = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: 3 }, async () => {
  for (let job; (job = queue.shift());) {
    const [dir, id, prompt, size = '1024x1024'] = job;
    try {
      mkdirSync(join(out, dir), { recursive: true });
      writeFileSync(join(out, dir, id + '.webp'), await generate(prompt, size));
      console.log(`  ✓ ${dir}/${id}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${dir}/${id}: ${e.message}`);
    }
  }
}));

const manifest = {};
for (const dir of ['oracle', 'tarot', 'signs', 'scenes', 'cards', 'whispers', 'icons', 'cats', 'nav', 'deck', 'spreads', 'plates', 'moons']) {
  const p = join(out, dir);
  if (existsSync(p)) manifest[dir] = readdirSync(p).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).sort();
}
writeFileSync(join(out, 'index.js'), `window.KOSMIA_ART=${JSON.stringify(manifest)};\n`);
console.log(`craft-images: wrote public/art/index.js${failed ? `, ${failed} failed (run again to retry)` : ''}`);
process.exit(failed ? 1 : 0);
