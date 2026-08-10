create table if not exists public.missions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  area_label text not null check (char_length(area_label) between 1 and 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  h3_cell text not null,
  polygon jsonb not null,
  target_taxon text not null check (target_taxon in ('Plants', 'Fungi', 'Birds', 'Insects')),
  analysis_snapshot jsonb not null,
  scheduled_date date not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 240),
  status text not null default 'planned' check (status in ('planned', 'completed')),
  evidence_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.missions enable row level security;

create policy "public missions are readable"
on public.missions for select
to anon, authenticated
using (is_public or owner_id = (select auth.uid()));

create policy "users create their own missions"
on public.missions for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update their missions"
on public.missions for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners delete their missions"
on public.missions for delete
to authenticated
using (owner_id = (select auth.uid()));

create index if not exists missions_public_created_idx
on public.missions (is_public, created_at desc);
