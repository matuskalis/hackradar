create extension if not exists postgis;

create type hackathon_format as enum ('onsite', 'online', 'hybrid');
create type location_precision as enum ('venue', 'city');
create type hackathon_source as enum ('manual', 'submit', 'devpost', 'mlh', 'hackclub', 'ics');
create type hackathon_status as enum ('pending', 'published', 'rejected', 'cancelled');

create table hackathons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_normalized text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Europe/Bratislava',
  format hackathon_format not null,
  venue_name text,
  address text,
  city text,
  country_code char(2),
  location geography(point, 4326),
  location_precision location_precision,
  url text,
  registration_url text,
  registration_deadline timestamptz,
  themes text[] not null default '{}',
  eligibility text,
  price_cents integer,
  currency char(3) not null default 'EUR',
  prizes text,
  capacity integer,
  organizer_name text,
  source hackathon_source not null,
  source_id text,
  source_url text,
  extra_sources jsonb not null default '[]'::jsonb,
  status hackathon_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hackathons_end_after_start check (end_at >= start_at),
  -- A pending row may still lack coordinates (geocoding failed, admin fixes it
  -- before publishing). A published on-site row must be placeable on the map.
  constraint hackathons_published_needs_location
    check (status <> 'published' or format = 'online' or location is not null)
);

create index hackathons_location_idx on hackathons using gist (location);
create index hackathons_start_at_idx on hackathons (start_at);
create index hackathons_status_start_at_idx on hackathons (status, start_at);
create index hackathons_themes_idx on hackathons using gin (themes);
create index hackathons_name_normalized_idx on hackathons (name_normalized);
create unique index hackathons_source_source_id_idx
  on hackathons (source, source_id) where source_id is not null;

create table import_runs (
  id uuid primary key default gen_random_uuid(),
  source hackathon_source not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  found integer not null default 0,
  inserted integer not null default 0,
  updated integer not null default 0,
  errors jsonb not null default '[]'::jsonb
);

create index import_runs_source_started_at_idx on import_runs (source, started_at desc);

create table geocode_cache (
  query text primary key,
  lat double precision,
  lng double precision,
  precision location_precision,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

create index rate_limits_window_start_idx on rate_limits (window_start);

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hackathons_updated_at
  before update on hackathons
  for each row execute function update_updated_at();

-- The only read surface public pages use. security_invoker keeps the caller's
-- RLS in force instead of the view owner's.
create view hackathons_public
with (security_invoker = true)
as
select
  h.*,
  st_y(h.location::geometry) as lat,
  st_x(h.location::geometry) as lng
from hackathons h
where h.status = 'published';
