-- Undo the celestial atlas release's bookmark kinds (removes any dreams and kept conversations first).
delete from public.bookmarks where kind in ('dream','chat');
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event'));
