-- Six-section release: birth details and settings on the profile, notes on tarot readings, a private journal,
-- named compatibility connections, bookmarks, and self-service account deletion. Additive only: no existing
-- column or row is changed. Rollback: supabase/rollback/20261026000000_six_sections_down.sql.

alter table public.profiles
  add column if not exists full_name     text not null default '',
  add column if not exists alt_name      text not null default '',
  add column if not exists birth         jsonb,                       -- only stored when birth_consent is true
  add column if not exists birth_consent boolean not null default false,
  add column if not exists settings      jsonb not null default '{}'::jsonb;

alter table public.tarot_readings
  add column if not exists note       text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create trigger tarot_readings_touch before update on public.tarot_readings
  for each row execute function public.touch_updated_at();

-- Freeform journal entries (daily-card notes stay on public.fortunes, so nothing is stored twice).
create table public.journal (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  kind        text not null default 'reflection' check (kind in ('reflection','synchronicity')),
  title       text not null default '',
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index journal_user_day_idx on public.journal (user_id, day desc);
create trigger journal_touch before update on public.journal
  for each row execute function public.touch_updated_at();

-- Saved comparisons: zodiac (two signs), resonance (two names) or synastry (the other person's birth details).
create table public.connections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default '',
  kind        text not null check (kind in ('zodiac','resonance','synastry')),
  data        jsonb not null default '{}'::jsonb,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index connections_user_idx on public.connections (user_id, created_at);
create trigger connections_touch before update on public.connections
  for each row execute function public.touch_updated_at();

-- Bookmarks for things that have no table of their own (a horoscope, a celestial event).
create table public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('horoscope','event')),
  ref         text not null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (user_id, kind, ref)
);

alter table public.journal     enable row level security;
alter table public.connections enable row level security;
alter table public.bookmarks   enable row level security;

create policy "own journal" on public.journal
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own connections" on public.connections
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own bookmarks" on public.bookmarks
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Earlier saved sign pairings become zodiac connections. Safe to run again: pairs already copied are skipped.
insert into public.connections (user_id, name, kind, data, created_at)
select m.user_id, '', 'zodiac', jsonb_build_object('a', m.sign_a, 'b', m.sign_b), m.created_at
from public.matches m
where not exists (
  select 1 from public.connections c
  where c.user_id = m.user_id and c.kind = 'zodiac'
    and c.data ->> 'a' = m.sign_a and c.data ->> 'b' = m.sign_b
);

-- Painted cards can now be removed by their owner (used before deleting an account).
create policy "remove own paintings" on storage.objects
  for delete to authenticated
  using (bucket_id = 'paintings' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Deletes the caller's own account; every table above cascades from auth.users.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = uid;
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
