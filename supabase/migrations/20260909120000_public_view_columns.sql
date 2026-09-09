-- The public view was `select h.*`, so the anonymous key could read columns
-- that exist only for our own bookkeeping: the deduplication key, the upstream
-- identifiers, and the raw geography. None of it is secret, but none of it is
-- anyone else's business either, and a view that names its columns will not
-- quietly start publishing the next internal column somebody adds.

drop view if exists hackathons_public;

create view hackathons_public
with (security_invoker = true)
as
select
  h.id,
  h.slug,
  h.name,
  h.description,
  h.start_at,
  h.end_at,
  h.timezone,
  h.format,
  h.venue_name,
  h.address,
  h.city,
  h.country_code,
  st_y(h.location::geometry) as lat,
  st_x(h.location::geometry) as lng,
  h.location_precision,
  h.url,
  h.registration_url,
  h.registration_deadline,
  h.themes,
  h.eligibility,
  h.price_cents,
  h.currency,
  h.prizes,
  h.capacity,
  h.organizer_name,
  h.source,
  h.updated_at
from hackathons h
where h.status = 'published';

grant select on hackathons_public to anon, authenticated, service_role;
