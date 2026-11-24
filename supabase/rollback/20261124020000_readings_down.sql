delete from public.bookmarks where kind in ('tarot','rmeta');
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event','dream','chat','sign','person','conn'));
