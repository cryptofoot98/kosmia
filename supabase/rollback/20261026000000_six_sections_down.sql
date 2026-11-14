-- Reverses 20261026000000_six_sections.sql. Run by hand only if the release is withdrawn: it drops the journal,
-- connections and bookmarks tables and the new profile columns, so export anything worth keeping first.
-- public.matches was never modified, so earlier saved pairings remain intact.

drop function if exists public.delete_my_account();
drop policy if exists "remove own paintings" on storage.objects;
drop table if exists public.bookmarks;
drop table if exists public.connections;
drop table if exists public.journal;
drop trigger if exists tarot_readings_touch on public.tarot_readings;
alter table public.tarot_readings drop column if exists note, drop column if exists updated_at;
alter table public.profiles
  drop column if exists full_name,
  drop column if exists alt_name,
  drop column if exists birth,
  drop column if exists birth_consent,
  drop column if exists settings;
delete from supabase_migrations.schema_migrations where version = '20261026000000';
