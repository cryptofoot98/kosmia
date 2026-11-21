-- The celestial atlas release: dreams (Dream Interpretation) and past Kassandra conversations are kept as bookmarks,
-- each with its own data. Widening the allowed kinds is additive; existing rows are untouched.
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;
alter table public.bookmarks add constraint bookmarks_kind_check check (kind in ('horoscope','event','dream','chat'));
