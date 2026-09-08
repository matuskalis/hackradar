-- The search functions did not return `timezone`, so the list and the map had
-- no way to render an event's dates in the zone the event actually happens in.
-- Rendering fell back to the server's zone, which is UTC in production.
--
-- Postgres cannot change the shape of a function's returned table in place, so
-- both functions are dropped and recreated.

drop function if exists hackathons_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz,
  hackathon_format[], text[], boolean, text, boolean, integer
);

drop function if exists hackathons_in_bbox(
  double precision, double precision, double precision, double precision,
  timestamptz, timestamptz, hackathon_format[], text[], boolean, text, integer
);

create or replace function hackathons_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_km double precision,
  from_at timestamptz default now(),
  to_at timestamptz default null,
  formats hackathon_format[] default null,
  theme_filter text[] default null,
  free_only boolean default false,
  eligibility_filter text default null,
  include_online boolean default true,
  max_rows integer default 200
)
returns table (
  id uuid,
  slug text,
  name text,
  start_at timestamptz,
  end_at timestamptz,
  registration_deadline timestamptz,
  timezone text,
  format hackathon_format,
  city text,
  country_code char(2),
  lat double precision,
  lng double precision,
  location_precision location_precision,
  themes text[],
  price_cents integer,
  currency char(3),
  eligibility text,
  distance_km double precision
)
language plpgsql
stable
as $$
declare
  center geography := st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography;
begin
  return query
  select
    h.id,
    h.slug,
    h.name,
    h.start_at,
    h.end_at,
    h.registration_deadline,
    h.timezone,
    h.format,
    h.city,
    h.country_code,
    st_y(h.location::geometry),
    st_x(h.location::geometry),
    h.location_precision,
    h.themes,
    h.price_cents,
    h.currency,
    h.eligibility,
    case when h.location is null then null
         else st_distance(h.location, center) / 1000.0 end
  from hackathons h
  where h.status = 'published'
    and h.end_at >= from_at
    and (to_at is null or h.start_at <= to_at)
    and (formats is null or h.format = any (formats))
    and (theme_filter is null or h.themes && theme_filter)
    and (not free_only or coalesce(h.price_cents, 0) = 0)
    and (eligibility_filter is null or h.eligibility = eligibility_filter)
    and (
      (h.location is not null and st_dwithin(h.location, center, radius_km * 1000))
      or (include_online and h.format = 'online')
    )
  -- 18 = distance_km; ordering by the output alias would be ambiguous here.
  order by 18 nulls last, h.start_at
  limit max_rows;
end;
$$;

create or replace function hackathons_in_bbox(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision,
  from_at timestamptz default now(),
  to_at timestamptz default null,
  formats hackathon_format[] default null,
  theme_filter text[] default null,
  free_only boolean default false,
  eligibility_filter text default null,
  max_rows integer default 500
)
returns table (
  id uuid,
  slug text,
  name text,
  start_at timestamptz,
  end_at timestamptz,
  registration_deadline timestamptz,
  timezone text,
  format hackathon_format,
  city text,
  country_code char(2),
  lat double precision,
  lng double precision,
  location_precision location_precision,
  themes text[],
  price_cents integer,
  currency char(3),
  eligibility text,
  distance_km double precision
)
language plpgsql
stable
as $$
declare
  box geography := st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography;
  center geography := st_setsrid(
    st_makepoint((min_lng + max_lng) / 2.0, (min_lat + max_lat) / 2.0), 4326
  )::geography;
begin
  return query
  select
    h.id,
    h.slug,
    h.name,
    h.start_at,
    h.end_at,
    h.registration_deadline,
    h.timezone,
    h.format,
    h.city,
    h.country_code,
    st_y(h.location::geometry),
    st_x(h.location::geometry),
    h.location_precision,
    h.themes,
    h.price_cents,
    h.currency,
    h.eligibility,
    st_distance(h.location, center) / 1000.0
  from hackathons h
  where h.status = 'published'
    and h.location is not null
    and h.end_at >= from_at
    and (to_at is null or h.start_at <= to_at)
    and (formats is null or h.format = any (formats))
    and (theme_filter is null or h.themes && theme_filter)
    and (not free_only or coalesce(h.price_cents, 0) = 0)
    and (eligibility_filter is null or h.eligibility = eligibility_filter)
    and st_intersects(h.location, box)
  order by h.start_at
  limit max_rows;
end;
$$;
