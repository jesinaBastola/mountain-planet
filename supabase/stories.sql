-- Traveller Stories: run this once in Supabase → SQL Editor → New query → Run.
-- Creates the table, a public photo bucket, and safe access rules:
--   * anyone can submit a story + upload photos
--   * new stories are hidden until you approve them (approved = true)
--   * visitors can only read approved stories

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 60),
  country text check (char_length(country) <= 60),
  trip text check (char_length(trip) <= 120),
  rating int not null default 5 check (rating between 1 and 5),
  story text not null check (char_length(story) between 1 and 2000),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  approved boolean not null default false
);

alter table public.stories enable row level security;

drop policy if exists "read approved stories" on public.stories;
create policy "read approved stories" on public.stories
  for select to anon using (approved = true);

drop policy if exists "submit stories for review" on public.stories;
create policy "submit stories for review" on public.stories
  for insert to anon with check (approved = false);

-- Public bucket for story photos (max 5 MB each, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-photos', 'story-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "anyone can upload story photos" on storage.objects;
create policy "anyone can upload story photos" on storage.objects
  for insert to anon with check (bucket_id = 'story-photos');

-- To approve a story: Table Editor → stories → tick "approved" on the row.
-- To remove one: delete the row (and its photos under Storage → story-photos).
