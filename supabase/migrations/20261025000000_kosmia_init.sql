-- Kosmia schema: one profile per auth user, plus their daily fortunes,
-- saved love matches and tarot readings. Every table is private to its owner.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  sign        text check (sign in ('aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces')),
  name        text not null default '',
  intro_seen  boolean not null default false,
  notif       jsonb not null default '{"on":false,"time":"08:00","monthly":true,"annual":true,"events":false,"sign2":""}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per user per local day: the oracle card drawn, whether it was kept, and the private reflection.
create table public.fortunes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  card_id     text not null,
  saved       boolean not null default false,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.matches (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  sign_a      text not null,
  sign_b      text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, sign_a, sign_b)
);

create table public.tarot_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  day         date not null,
  spread      text not null,
  question    text not null default '',
  cards       jsonb not null,
  created_at  timestamptz not null default now()
);

create index tarot_readings_user_created_idx on public.tarot_readings (user_id, created_at);

-- updated_at bookkeeping
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger fortunes_touch before update on public.fortunes
  for each row execute function public.touch_updated_at();

-- Create a profile row as soon as someone signs up; the sign chosen on the
-- join screen travels in the sign-up metadata.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  s text := new.raw_user_meta_data ->> 'sign';
begin
  insert into public.profiles (id, email, sign)
  values (
    new.id,
    new.email,
    case when s in ('aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces') then s end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row-level security: owners only.
alter table public.profiles       enable row level security;
alter table public.fortunes       enable row level security;
alter table public.matches        enable row level security;
alter table public.tarot_readings enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own fortunes" on public.fortunes
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own matches" on public.matches
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own readings" on public.tarot_readings
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
