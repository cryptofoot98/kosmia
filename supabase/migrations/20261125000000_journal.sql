-- The Journal's four areas: reflections, intentions and gratitude are pages of their own kinds, and each page keeps
-- where it came from (the Ritual, a reading, a celestial event), what it links to and the Moon it was written under.
alter table public.journal drop constraint if exists journal_kind_check;
alter table public.journal add constraint journal_kind_check check (kind in ('reflection','synchronicity','intention','gratitude'));
alter table public.journal add column if not exists data jsonb not null default '{}'::jsonb;
