-- AI features: per-user daily quotas for the paid image and voice endpoints,
-- and a private bucket for each user's painted daily cards.

create table public.ai_usage (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null default current_date,
  kind     text not null,
  count    integer not null default 0,
  primary key (user_id, day, kind)
);

alter table public.ai_usage enable row level security;

create policy "read own usage" on public.ai_usage
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Claims one use of `p_kind` for the calling user today (UTC). Returns false
-- once the day's count has reached `p_limit`. The Netlify functions call this
-- with the user's own token before spending money on OpenAI or ElevenLabs;
-- calling it directly only ever uses up the caller's own allowance.
create function public.claim_ai_quota(p_kind text, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then return false; end if;
  insert into public.ai_usage (user_id, day, kind, count)
  values (uid, current_date, p_kind, 1)
  on conflict (user_id, day, kind) do update
    set count = public.ai_usage.count + 1
    where public.ai_usage.count < p_limit
  returning count into n;
  return n is not null and n <= p_limit;
end $$;

revoke execute on function public.claim_ai_quota(text, integer) from public, anon;
grant execute on function public.claim_ai_quota(text, integer) to authenticated;

-- Painted cards live at paintings/<user id>/<yyyy-mm-dd>.webp, private to their owner.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('paintings', 'paintings', false, 5242880, array['image/webp'])
on conflict (id) do nothing;

create policy "read own paintings" on storage.objects
  for select to authenticated
  using (bucket_id = 'paintings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "add own paintings" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'paintings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "replace own paintings" on storage.objects
  for update to authenticated
  using (bucket_id = 'paintings' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'paintings' and (storage.foldername(name))[1] = (select auth.uid())::text);
