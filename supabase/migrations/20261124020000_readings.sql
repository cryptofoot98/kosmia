-- Tarot & Your Readings: tarot readings with their whole interpretation ('tarot') and the reader's own marks on any saved
-- reading, favourites, names, notes and linked reflections ('rmeta'), are bookmarks. Additive; existing rows untouched.
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event','dream','chat','sign','person','conn','tarot','rmeta'));
