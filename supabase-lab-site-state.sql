create table if not exists public.lab_site_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.lab_site_state enable row level security;

drop policy if exists "public read lab site state" on public.lab_site_state;
drop policy if exists "public write lab site state" on public.lab_site_state;

create policy "public read lab site state"
on public.lab_site_state
for select
to anon
using (true);

create policy "public write lab site state"
on public.lab_site_state
for all
to anon
using (true)
with check (true);
