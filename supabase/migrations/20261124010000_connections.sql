-- Connections: people kept in My Relationships ('person') and saved connection readings ('conn') are bookmarks with
-- their own data. Widening the allowed kinds is additive; existing rows are untouched.
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event','dream','chat','sign','person','conn'));
