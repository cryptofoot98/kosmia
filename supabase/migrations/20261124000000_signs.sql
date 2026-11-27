-- Signs & Synchronicities: Sacred Number and Synchronicity readings are kept as bookmarks of kind 'sign', each with its own
-- data. Widening the allowed kinds is additive; existing rows are untouched.
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event','dream','chat','sign'));
