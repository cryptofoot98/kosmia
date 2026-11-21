#!/bin/sh
# The paintings (public/art, about 80 MB) can be left out of a deploy upload, which then stays small enough to go
# through: the upload carries public/art/FETCH instead, naming the commit (line 1) and how many files public/art holds
# at that commit (line 2), and the build fetches that commit's public/art from GitHub (the repository is public).
# Run by Netlify before build-config.sh. Without FETCH it does nothing. If the paintings cannot be fetched the build
# fails, so the live site is never replaced by one without them.
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
mark="$root/public/art/FETCH"
[ -f "$mark" ] || exit 0
sha="$(sed -n 1p "$mark" | tr -d '\r')"
want="$(sed -n 2p "$mark" | tr -d '\r')"
echo "fetch-art: fetching public/art at $sha"
curl -fsSL --retry 3 "https://codeload.github.com/cryptofoot98/kosmia/tar.gz/$sha" |
 tar -xz -C "$root" --strip-components=1 "kosmia-$sha/public/art"
rm -f "$mark"
got="$(find "$root/public/art" -type f | wc -l | tr -d ' ')"
if [ "$got" -lt "$want" ]; then
  echo "fetch-art: expected $want files in public/art, found $got" >&2
  exit 1
fi
echo "fetch-art: public/art has $got files"
