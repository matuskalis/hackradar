alter table hackathons enable row level security;
alter table import_runs enable row level security;
alter table geocode_cache enable row level security;
alter table rate_limits enable row level security;

-- Anonymous visitors read published rows only. Writes go through the service
-- role, which bypasses RLS; no anon write policy exists on purpose.
drop policy if exists "public read published" on hackathons;
create policy "public read published" on hackathons
  for select
  using (status = 'published');

-- Grants are explicit: this project does not rely on the Data API's default
-- privileges for newly created tables.
grant select on hackathons to anon, authenticated;
grant select on hackathons_public to anon, authenticated;

grant select, insert, update, delete on
  hackathons, import_runs, geocode_cache, rate_limits to service_role;
grant select on hackathons_public to service_role;
