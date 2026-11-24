delete from public.bookmarks where kind = 'sign';
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event','dream','chat'));
