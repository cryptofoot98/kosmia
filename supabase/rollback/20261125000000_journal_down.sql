update public.journal set kind='reflection' where kind in ('intention','gratitude');
alter table public.journal drop constraint if exists journal_kind_check;
alter table public.journal add constraint journal_kind_check check (kind in ('reflection','synchronicity'));
alter table public.journal drop column if exists data;
