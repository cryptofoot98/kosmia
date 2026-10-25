#!/bin/sh
# Writes public/config.js from environment variables so the static site knows
# which Supabase project to talk to. Run by Netlify as the build command.
# Only the public anon key belongs here; it is safe in the browser because
# every table is protected by row-level security.
set -eu
out="$(dirname "$0")/../public/config.js"
url="${SUPABASE_URL:-}"
key="${SUPABASE_ANON_KEY:-}"
if [ -z "$url" ] || [ -z "$key" ]; then
  echo "build-config: SUPABASE_URL / SUPABASE_ANON_KEY not set, building in local-only mode" >&2
fi
cat > "$out" <<JS
window.KOSMIA_CONFIG={supabaseUrl:"$url",supabaseAnonKey:"$key"};
JS
echo "build-config: wrote $out"
