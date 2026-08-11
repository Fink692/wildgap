revoke all privileges on table public.missions from anon, authenticated;

grant select on table public.missions to anon;

grant select, insert, update, delete on table public.missions to authenticated;
